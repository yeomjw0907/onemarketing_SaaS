/**
 * 무료 인스타그램 리포트 — OAuth 콜백
 * 1. code → access_token 교환
 * 2. Facebook Pages → Instagram Business Account 조회
 * 3. 팔로워/인사이트/미디어 데이터 수집
 * 4. Gemini AI 한 줄 진단 생성
 * 5. free_report_sessions 저장 → /free-report/result/{id} 리다이렉트
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v21.0";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onemarketing.kr";

async function graph(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Graph API ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/free-report?error=cancelled`);
  }

  try {
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const redirectUri = `${APP_URL}/api/free-report/callback`;

    // 1. code → short-lived token
    const tokenRes = await graph("/oauth/access_token", "", {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
      access_token: "none", // override — graph() adds this, but /oauth/access_token doesn't need it
    }).catch(async () => {
      // fallback: direct fetch without access_token param
      const url = new URL(`${GRAPH}/oauth/access_token`);
      url.searchParams.set("client_id", appId);
      url.searchParams.set("client_secret", appSecret);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("code", code);
      const r = await fetch(url.toString());
      return r.json() as Promise<Record<string, unknown>>;
    });

    const shortToken = tokenRes.access_token as string;
    if (!shortToken) throw new Error("토큰 발급 실패");

    // 2. short → long-lived token
    const longRes = await (async () => {
      const url = new URL(`${GRAPH}/oauth/access_token`);
      url.searchParams.set("grant_type", "fb_exchange_token");
      url.searchParams.set("client_id", appId);
      url.searchParams.set("client_secret", appSecret);
      url.searchParams.set("fb_exchange_token", shortToken);
      const r = await fetch(url.toString());
      return r.json() as Promise<Record<string, unknown>>;
    })();

    const token = (longRes.access_token as string) ?? shortToken;

    // 3. Facebook Pages 목록
    const pagesRes = await graph("/me/accounts", token, { fields: "id,name,instagram_business_account" });
    const pages = (pagesRes.data as Record<string, unknown>[]) ?? [];

    // Instagram 비즈니스 계정 찾기
    let igId: string | null = null;
    for (const page of pages) {
      const iba = page.instagram_business_account as Record<string, string> | undefined;
      if (iba?.id) { igId = iba.id; break; }
    }

    if (!igId) {
      return NextResponse.redirect(`${APP_URL}/free-report?error=no_business_account`);
    }

    // 4. Instagram 계정 기본 정보
    const profile = await graph(`/${igId}`, token, {
      fields: "id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url,website",
    });

    // 5. 최근 30일 인사이트
    const since = Math.floor((Date.now() - 30 * 86400_000) / 1000).toString();
    const until = Math.floor(Date.now() / 1000).toString();

    const insightsRes = await graph(`/${igId}/insights`, token, {
      metric: "impressions,reach,profile_views,follower_count",
      period: "day",
      since,
      until,
    }).catch(() => ({ data: [] }));

    // 집계
    const insights: Record<string, number> = {};
    for (const item of (insightsRes.data as Record<string, unknown>[]) ?? []) {
      const name = item.name as string;
      const values = (item.values as { value: number }[]) ?? [];
      insights[name] = values.reduce((s, v) => s + (v.value || 0), 0);
    }

    // 6. 최근 게시물 9개
    const mediaRes = await graph(`/${igId}/media`, token, {
      fields: "id,caption,media_type,timestamp,thumbnail_url,media_url,like_count,comments_count",
      limit: "9",
    }).catch(() => ({ data: [] }));
    const media = (mediaRes.data as Record<string, unknown>[]) ?? [];

    // 인게이지먼트율 계산
    const followers = Number(profile.followers_count) || 0;
    const totalLikes = media.reduce((s, m) => s + (Number(m.like_count) || 0), 0);
    const totalComments = media.reduce((s, m) => s + (Number(m.comments_count) || 0), 0);
    const engagementRate = media.length > 0 && followers > 0
      ? ((totalLikes + totalComments) / media.length / followers) * 100
      : 0;

    // 7. Gemini AI 한 줄 진단
    let aiComment = "";
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      const prompt = `인스타그램 비즈니스 계정 분석 결과:
- 팔로워: ${followers.toLocaleString()}명
- 최근 30일 도달: ${(insights.reach || 0).toLocaleString()}명
- 최근 30일 노출: ${(insights.impressions || 0).toLocaleString()}회
- 평균 인게이지먼트율: ${engagementRate.toFixed(2)}%
- 게시물 수: ${profile.media_count}개

마케팅 전문가로서 이 계정의 현재 상태를 2문장으로 진단하고, 가장 중요한 개선 포인트 1가지를 구체적으로 제안해주세요. 한국어로 답변하세요.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const geminiData = await geminiRes.json() as Record<string, unknown>;
      aiComment = (geminiData?.candidates as Record<string, unknown>[])?.[0]
        ?.content?.parts?.[0]?.text as string ?? "";
    } catch {
      aiComment = "";
    }

    // 8. 세션 저장
    const svc = await createServiceClient();
    const reportData = {
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        biography: profile.biography,
        followers_count: profile.followers_count,
        follows_count: profile.follows_count,
        media_count: profile.media_count,
        profile_picture_url: profile.profile_picture_url,
        website: profile.website,
      },
      insights,
      engagement_rate: engagementRate,
      media: media.slice(0, 9),
      ai_comment: aiComment,
      fetched_at: new Date().toISOString(),
    };

    const { data: session, error: dbErr } = await svc
      .from("free_report_sessions")
      .insert({
        ig_user_id: igId,
        username: String(profile.username ?? ""),
        report_data: reportData,
      })
      .select("id")
      .single();

    if (dbErr || !session) throw new Error("세션 저장 실패");

    return NextResponse.redirect(`${APP_URL}/free-report/result/${session.id}`);
  } catch (err) {
    console.error("free-report callback error:", err);
    return NextResponse.redirect(`${APP_URL}/free-report?error=fetch_failed`);
  }
}
