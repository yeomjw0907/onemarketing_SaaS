/**
 * 포털: 통합 지표 API (Meta Ads + GA4 병합)
 * GET /api/portal/combined-metrics?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CombinedMetric } from "@/lib/types/database";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.profile?.client_id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const clientId = session.profile.client_id;

  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().split("T")[0];
  const defaultFrom = new Date(Date.now() - 30 * 86400_000).toISOString().split("T")[0];
  const from = searchParams.get("from") || defaultFrom;
  const to = searchParams.get("to") || today;

  const supabase = await createClient();

  const { data: metrics } = await supabase
    .from("platform_metrics")
    .select("platform, metric_date, metric_key, metric_value")
    .eq("client_id", clientId)
    .in("platform", ["meta_ads", "google_analytics"])
    .gte("metric_date", from)
    .lte("metric_date", to)
    .order("metric_date", { ascending: true });

  // 날짜 기준 병합
  const byDate: Record<string, CombinedMetric> = {};

  for (const row of metrics || []) {
    const date = row.metric_date;
    if (!byDate[date]) byDate[date] = { date };

    if (row.platform === "meta_ads") {
      if (row.metric_key === "impressions") byDate[date].impressions = (byDate[date].impressions ?? 0) + row.metric_value;
      else if (row.metric_key === "clicks") byDate[date].clicks = (byDate[date].clicks ?? 0) + row.metric_value;
      else if (row.metric_key === "cost") byDate[date].cost = (byDate[date].cost ?? 0) + row.metric_value;
      else if (row.metric_key === "ctr") byDate[date].ctr = row.metric_value;
      else if (row.metric_key === "cpc") byDate[date].cpc = row.metric_value;
    } else if (row.platform === "google_analytics") {
      if (row.metric_key === "sessions") byDate[date].sessions = (byDate[date].sessions ?? 0) + row.metric_value;
      else if (row.metric_key === "bounce_rate") byDate[date].bounce_rate = row.metric_value;
      else if (row.metric_key === "avg_session_duration") byDate[date].avg_session_duration = row.metric_value;
    }
  }

  // 클릭→세션 전환율 계산
  const result: CombinedMetric[] = Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      click_to_session_rate:
        d.clicks && d.clicks > 0 && d.sessions !== undefined
          ? (d.sessions / d.clicks) * 100
          : undefined,
    }));

  return NextResponse.json({ data: result });
}
