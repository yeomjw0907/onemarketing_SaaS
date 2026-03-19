/**
 * Cron: Instagram 인사이트 동기화
 * Authorization: Bearer {CRON_SECRET} 헤더 필요
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchIgDailyInsights,
  fetchIgRecentMedia,
  fetchIgMediaInsights,
} from "@/lib/integrations/instagram-insights";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = await createServiceClient();

  // 활성 계정 전체 조회
  const { data: accounts, error: fetchErr } = await svc
    .from("instagram_accounts")
    .select("*")
    .eq("status", "active");

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ message: "동기화할 계정 없음", total: 0 });
  }

  // 최근 30일 날짜 계산
  const until = new Date();
  const since = new Date(until.getTime() - 30 * 86400_000);
  const sinceStr = Math.floor(since.getTime() / 1000).toString();
  const untilStr = Math.floor(until.getTime() / 1000).toString();

  const results = await Promise.allSettled(
    accounts.map(async (account: Record<string, unknown>) => {
      const accountId = account.id as string;
      const igId = account.instagram_id as string;
      const token = account.access_token as string;
      const clientId = account.client_id as string;

      try {
        // 1. 최근 30일 daily insights
        const dailyStats = await fetchIgDailyInsights(igId, token, sinceStr, untilStr);

        if (dailyStats.length > 0) {
          const rows = dailyStats.map((s) => ({
            account_id: accountId,
            client_id: clientId,
            stat_date: s.date,
            followers_count: s.followersCount,
            impressions: s.impressions,
            reach: s.reach,
            profile_views: s.profileViews,
            website_clicks: s.websiteClicks,
          }));

          await svc
            .from("instagram_daily_stats")
            .upsert(rows, { onConflict: "account_id,stat_date" });
        }

        // 2. 최근 20개 미디어 + 인사이트
        const media = await fetchIgRecentMedia(igId, token, 20);

        for (const m of media) {
          const insights = await fetchIgMediaInsights(m.id, token, m.mediaType).catch(() => ({
            saved: 0,
            reach: 0,
            impressions: 0,
          }));

          const followersCount = account.followers_count as number | null;
          const totalInteractions = m.likeCount + m.commentsCount + insights.saved;
          const engagementRate =
            followersCount && followersCount > 0
              ? totalInteractions / followersCount
              : 0;

          await svc
            .from("instagram_media_metrics")
            .upsert(
              {
                account_id: accountId,
                client_id: clientId,
                media_id: m.id,
                media_type: m.mediaType,
                caption: m.caption,
                media_url: m.mediaUrl,
                thumbnail_url: m.thumbnailUrl,
                posted_at: m.timestamp,
                like_count: m.likeCount,
                comments_count: m.commentsCount,
                saved_count: insights.saved,
                reach: insights.reach,
                impressions: insights.impressions,
                engagement_rate: engagementRate,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "account_id,media_id" },
            );
        }

        // 3. last_synced_at 업데이트
        await svc
          .from("instagram_accounts")
          .update({
            last_synced_at: new Date().toISOString(),
            status: "active",
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accountId);

        return { accountId, success: true, dailyCount: dailyStats.length, mediaCount: media.length };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        await svc
          .from("instagram_accounts")
          .update({
            status: "error",
            error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accountId);

        return { accountId, success: false, error: errorMsg };
      }
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled" && (r.value as { success: boolean }).success).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    total: accounts.length,
    succeeded,
    failed,
    results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason })),
  });
}
