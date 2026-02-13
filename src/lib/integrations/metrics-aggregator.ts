/**
 * 성과 지표 자동화 — platform_metrics(일별) → 주간/월간 집계 → metrics 반영
 * @see docs/07-성과지표-자동화-Meta-GA.md
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PeriodType } from "@/lib/types/database";

/** 플랫폼에서 저장하는 metric_key → KPI(metrics) metric_key 매핑 */
export const PLATFORM_METRIC_TO_KPI: Record<string, string> = {
  // Meta (fetchMetaMetrics)
  cost: "revenue",
  conversions: "conversions",
  impressions: "impressions",
  clicks: "clicks",
  reach: "reach",
  // GA4 (fetchGA4Metrics)
  pageviews: "page_views",
  sessions: "sessions",
  users: "users",
  new_users: "new_users",
  bounce_rate: "bounce_rate",
  avg_session_duration: "avg_session_duration",
};

/** 주(월요일~일요일) 경계 반환 */
function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 월요일 시작
  d.setDate(d.getDate() + diff);
  const start = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 6);
  const end = d.toISOString().slice(0, 10);
  return { start, end };
}

/** 월(1일~말일) 경계 반환 */
function getMonthBounds(date: Date): { start: string; end: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last = new Date(y, m + 1, 0);
  const end = last.toISOString().slice(0, 10);
  return { start, end };
}

/** dateFrom~dateTo 구간을 periodType에 맞게 기간 목록으로 쪼갬 */
function getPeriods(
  dateFrom: string,
  dateTo: string,
  periodType: PeriodType
): Array<{ period_start: string; period_end: string }> {
  const from = new Date(dateFrom + "T12:00:00Z");
  const to = new Date(dateTo + "T12:00:00Z");
  const result: Array<{ period_start: string; period_end: string }> = [];

  if (periodType === "weekly") {
    let cur = new Date(from);
    while (cur <= to) {
      const { start, end } = getWeekBounds(cur);
      result.push({ period_start: start, period_end: end });
      cur.setDate(cur.getDate() + 7);
    }
    // 중복 제거 (같은 주가 두 번 들어갈 수 있음)
    const seen = new Set<string>();
    return result.filter((p) => {
      const k = `${p.period_start}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  // monthly
  let cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const toMonth = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= toMonth) {
    const { start, end } = getMonthBounds(cur);
    result.push({ period_start: start, period_end: end });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

export interface AggregateOptions {
  clientId?: string;
  periodType: PeriodType;
  dateFrom: string;
  dateTo: string;
}

export interface AggregateResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * platform_metrics를 주간/월간으로 집계해 metrics 테이블에 반영
 * - 해당 클라이언트의 kpi_definitions에 있는 metric_key만 반영
 * - 플랫폼 metric_key는 PLATFORM_METRIC_TO_KPI로 매핑 후, 매핑된 키가 KPI에 있을 때만 저장
 */
export async function aggregatePlatformMetricsToMetrics(
  supabase: SupabaseClient,
  options: AggregateOptions
): Promise<AggregateResult> {
  const { clientId, periodType, dateFrom, dateTo } = options;
  const result: AggregateResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // 관리자 1명 조회 (metrics.created_by용)
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .single();

  const createdBy = adminProfile?.user_id;
  if (!createdBy) {
    result.success = false;
    result.errors.push("관리자 계정이 없어 created_by를 설정할 수 없습니다.");
    return result;
  }

  const periods = getPeriods(dateFrom, dateTo, periodType);
  if (periods.length === 0) {
    return result;
  }

  // 집계 대상 client_id 목록
  let clientIds: string[] = [];
  if (clientId) {
    clientIds = [clientId];
  } else {
    const { data: rows } = await supabase
      .from("platform_metrics")
      .select("client_id")
      .gte("metric_date", dateFrom)
      .lte("metric_date", dateTo);
    const set = new Set<string>();
    rows?.forEach((r: { client_id: string }) => set.add(r.client_id));
    clientIds = Array.from(set);
  }

  for (const clientId of clientIds) {
    const { data: kpiDefs } = await supabase
      .from("kpi_definitions")
      .select("metric_key")
      .eq("client_id", clientId);
    const allowedKeys = new Set((kpiDefs || []).map((k: { metric_key: string }) => k.metric_key));

    for (const { period_start, period_end } of periods) {
      const { data: rows } = await supabase
        .from("platform_metrics")
        .select("metric_key, metric_value")
        .eq("client_id", clientId)
        .gte("metric_date", period_start)
        .lte("metric_date", period_end);

      if (!rows || rows.length === 0) continue;

      // (metric_key → sum)
      const sumByKey: Record<string, number> = {};
      for (const r of rows as { metric_key: string; metric_value: number }[]) {
        const kpiKey = PLATFORM_METRIC_TO_KPI[r.metric_key] ?? r.metric_key;
        if (!allowedKeys.has(kpiKey)) continue;
        sumByKey[kpiKey] = (sumByKey[kpiKey] ?? 0) + Number(r.metric_value);
      }

      for (const [metric_key, value] of Object.entries(sumByKey)) {
        const { data: existing } = await supabase
          .from("metrics")
          .select("id, value")
          .eq("client_id", clientId)
          .eq("period_type", periodType)
          .eq("period_start", period_start)
          .eq("period_end", period_end)
          .eq("metric_key", metric_key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("metrics")
            .update({ value: Math.round(value * 100) / 100 })
            .eq("id", existing.id);
          if (error) {
            result.errors.push(`update ${clientId} ${metric_key}: ${error.message}`);
            continue;
          }
          result.updated++;
        } else {
          const { error } = await supabase.from("metrics").insert({
            client_id: clientId,
            period_type: periodType,
            period_start,
            period_end,
            metric_key,
            value: Math.round(value * 100) / 100,
            notes: "플랫폼 연동 자동 반영",
            visibility: "visible",
            created_by: createdBy,
          });
          if (error) {
            result.errors.push(`insert ${clientId} ${metric_key}: ${error.message}`);
            continue;
          }
          result.inserted++;
        }
      }
    }
  }

  if (result.errors.length > 0) result.success = false;
  return result;
}
