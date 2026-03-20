/**
 * LinkedIn OAuth 시작 라우트
 * 어드민 전용 — query param: clientId
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId 파라미터 누락" }, { status: 400 });
  }

  // 어드민 인증 체크
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "어드민 권한이 필요합니다." }, { status: 403 });
  }

  const linkedInClientId = process.env.LINKEDIN_CLIENT_ID;
  if (!linkedInClientId) {
    return NextResponse.json({ error: "LINKEDIN_CLIENT_ID 환경 변수가 설정되지 않았습니다." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;

  // state에 clientId를 base64 인코딩
  const state = Buffer.from(JSON.stringify({ clientId })).toString("base64url");

  const scope = "r_ads r_ads_reporting rw_ads";
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(linkedInClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(new URL(authUrl));
}
