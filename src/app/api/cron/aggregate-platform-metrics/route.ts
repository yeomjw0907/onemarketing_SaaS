/**
 * Vercel Cron — platform_metrics → metrics 집계 (성과 지표 자동 반영)
 * 매일 1회 sync-metrics 10분 뒤 실행 (10 21 * * *). 지난 주·지난 달 구간 집계
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { aggregatePlatformMetricsToMetrics } from "@/lib/integrations/metrics-aggregator";

export const runtime = "nodejs";
export const maxDuration = 120;

function lastWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 7 : day; // 지난 주 일요일
  const lastSun = new Date(now);
  lastSun.setDate(now.getDate() - diff);
  const lastMon = new Date(lastSun);
  lastMon.setDate(lastSun.getDate() - 6);
  return {
    from: lastMon.toISOString().slice(0, 10),
    to: lastSun.toISOString().slice(0, 10),
  };
}

function lastMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const firstOfLastMonth = new Date(y, m - 1, 1);
  const lastOfLastMonth = new Date(y, m, 0);
  const from = `${firstOfLastMonth.getFullYear()}-${String(firstOfLastMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const to = `${lastOfLastMonth.getFullYear()}-${String(lastOfLastMonth.getMonth() + 1).padStart(2, "0")}-${String(lastOfLastMonth.getDate()).padStart(2, "0")}`;
  return { from, to };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  const weekly = lastWeekRange();
  const monthly = lastMonthRange();

  const [weeklyResult, monthlyResult] = await Promise.all([
    aggregatePlatformMetricsToMetrics(supabase, {
      periodType: "weekly",
      dateFrom: weekly.from,
      dateTo: weekly.to,
    }),
    aggregatePlatformMetricsToMetrics(supabase, {
      periodType: "monthly",
      dateFrom: monthly.from,
      dateTo: monthly.to,
    }),
  ]);

  return NextResponse.json({
    message: "성과 지표 집계 완료",
    weekly: {
      period: weekly,
      ...weeklyResult,
    },
    monthly: {
      period: monthly,
      ...monthlyResult,
    },
  });
}
