/**
 * Cron: GA4 페이지별 지표 동기화
 * Authorization: Bearer {CRON_SECRET} 헤더 필요
 * 매일 어제 날짜 기준으로 ga4_page_metrics 테이블에 upsert
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchGA4PageMetrics } from "@/lib/integrations/ga4";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = await createServiceClient();

  // 어제 날짜
  const yesterday = new Date(Date.now() - 86400_000).toISOString().split("T")[0];

  // google_analytics 활성 연동 전체 조회
  const { data: integrations, error: fetchErr } = await svc
    .from("data_integrations")
    .select("*")
    .eq("platform", "google_analytics")
    .eq("status", "active");

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ message: "동기화할 GA4 연동 없음", total: 0 });
  }

  const results = await Promise.allSettled(
    integrations.map(async (integration) => {
      try {
        const { pageMetrics, error } = await fetchGA4PageMetrics(
          integration,
          yesterday,
          yesterday,
        );

        if (error) {
          throw new Error(error);
        }

        if (pageMetrics.length === 0) {
          return { integrationId: integration.id, success: true, upserted: 0 };
        }

        const rows = pageMetrics.map((m) => ({
          client_id: integration.client_id,
          integration_id: integration.id,
          metric_date: yesterday,
          page_path: m.pagePath,
          sessions: m.sessions,
          users: m.users,
          pageviews: m.pageviews,
          bounce_rate: m.bounceRate,
          avg_session_duration: m.avgSessionDuration,
          scroll_depth_90: m.scrollDepth90,
        }));

        const { error: upsertErr } = await svc
          .from("ga4_page_metrics")
          .upsert(rows, { onConflict: "integration_id,metric_date,page_path" });

        if (upsertErr) {
          throw new Error(upsertErr.message);
        }

        // last_synced_at 업데이트
        await svc
          .from("data_integrations")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", integration.id);

        return { integrationId: integration.id, success: true, upserted: rows.length };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // 에러 로그 기록
        await svc.from("integration_sync_logs").insert({
          integration_id: integration.id,
          client_id: integration.client_id,
          platform: integration.platform,
          sync_type: "incremental",
          status: "error",
          records_synced: 0,
          error_message: errorMsg,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });

        return { integrationId: integration.id, success: false, error: errorMsg };
      }
    }),
  );

  const succeeded = results.filter(
    (r) => r.status === "fulfilled" && (r.value as { success: boolean }).success,
  ).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    date: yesterday,
    total: integrations.length,
    succeeded,
    failed,
    results: results.map((r) => (r.status === "fulfilled" ? r.value : { error: r.reason })),
  });
}
