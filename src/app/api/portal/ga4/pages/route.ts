/**
 * 포털: GA4 페이지별 집계 지표 API
 * GET /api/portal/ga4/pages?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=20
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface PageStat {
  pagePath: string;
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  avgBounceRate: number;
  avgScrollDepth90: number;
  avgSessionDuration: number;
}

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
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("ga4_page_metrics")
    .select("page_path, sessions, users, pageviews, bounce_rate, avg_session_duration, scroll_depth_90")
    .eq("client_id", clientId)
    .gte("metric_date", from)
    .lte("metric_date", to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 페이지 경로별 집계
  const byPath: Record<string, {
    sessions: number[];
    users: number[];
    pageviews: number[];
    bounceRates: number[];
    scrollDepths: number[];
    durations: number[];
  }> = {};

  for (const row of rows || []) {
    const p = row.page_path;
    if (!byPath[p]) {
      byPath[p] = { sessions: [], users: [], pageviews: [], bounceRates: [], scrollDepths: [], durations: [] };
    }
    byPath[p].sessions.push(Number(row.sessions));
    byPath[p].users.push(Number(row.users));
    byPath[p].pageviews.push(Number(row.pageviews));
    byPath[p].bounceRates.push(Number(row.bounce_rate));
    byPath[p].scrollDepths.push(Number(row.scroll_depth_90));
    byPath[p].durations.push(Number(row.avg_session_duration));
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const stats: PageStat[] = Object.entries(byPath)
    .map(([pagePath, vals]) => ({
      pagePath,
      totalSessions: sum(vals.sessions),
      totalUsers: sum(vals.users),
      totalPageviews: sum(vals.pageviews),
      avgBounceRate: avg(vals.bounceRates),
      avgScrollDepth90: avg(vals.scrollDepths),
      avgSessionDuration: avg(vals.durations),
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .slice(0, limit);

  return NextResponse.json({ data: stats });
}
