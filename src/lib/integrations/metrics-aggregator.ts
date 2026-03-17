/**
 * 성과 지표 자동화 — platform_metrics(일별) → 주간/월간 집계 → metrics 반영
 *
 * KPI computation 규칙 기반:
 *   sum:   sources 합산
 *   avg:   sources 평균
 *   ratio: numerator 합 / denominator 합
 *
 * computation이 null인 KPI는 건너뜀 (수동 입력 전용)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KpiComputation, KpiMetricSource, PeriodType } from "@/lib/types/database";

/** 주(월요일~일요일) 경계 반환 */
function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
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
  periodType: PeriodType,
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
    const seen = new Set<string>();
    return result.filter((p) => {
      if (seen.has(p.period_start)) return false;
      seen.add(p.period_start);
      return true;
    });
  }

  let cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const toMonth = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= toMonth) {
    const { start, end } = getMonthBounds(cur);
    result.push({ period_start: start, period_end: end });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

/**
 * 특정 기간의 platform_metrics에서 sources에 해당하는 행들을 조회
 * platform="*" 이면 모든 플랫폼에서 해당 metric_key를 가져옴
 */
async function fetchSourceValues(
  supabase: SupabaseClient,
  clientId: string,
  sources: KpiMetricSource[],
  periodStart: string,
  periodEnd: string,
): Promise<{ values: number[]; count: number }> {
  const values: number[] = [];

  for (const source of sources) {
    let query = supabase
      .from("platform_metrics")
      .select("metric_value")
      .eq("client_id", clientId)
      .eq("metric_key", source.metric)
      .gte("metric_date", periodStart)
      .lte("metric_date", periodEnd);

    if (source.platform !== "*") {
      query = query.eq("platform", source.platform);
    }

    const { data } = await query;
    if (data) {
      values.push(...data.map((r: { metric_value: number }) => Number(r.metric_value)));
    }
  }

  return { values, count: values.length };
}

/**
 * computation 규칙으로 단일 KPI 값 계산
 * 데이터 없으면 null 반환 (저장 안 함)
 */
async function computeKpiValue(
  supabase: SupabaseClient,
  clientId: string,
  computation: KpiComputation,
  periodStart: string,
  periodEnd: string,
): Promise<number | null> {
  if (computation.type === "sum") {
    const { values } = await fetchSourceValues(supabase, clientId, computation.sources, periodStart, periodEnd);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0);
  }

  if (computation.type === "avg") {
    const { values } = await fetchSourceValues(supabase, clientId, computation.sources, periodStart, periodEnd);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  if (computation.type === "ratio") {
    const { values: numVals } = await fetchSourceValues(supabase, clientId, computation.numerator, periodStart, periodEnd);
    const { values: denVals } = await fetchSourceValues(supabase, clientId, computation.denominator, periodStart, periodEnd);
    const num = numVals.reduce((a, b) => a + b, 0);
    const den = denVals.reduce((a, b) => a + b, 0);
    if (den === 0) return null;
    return num / den;
  }

  return null;
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
 * computation이 정의된 KPI만 처리. computation=null이면 수동 입력 KPI로 건너뜀.
 */
export async function aggregatePlatformMetricsToMetrics(
  supabase: SupabaseClient,
  options: AggregateOptions,
): Promise<AggregateResult> {
  const { clientId, periodType, dateFrom, dateTo } = options;
  const result: AggregateResult = { success: true, inserted: 0, updated: 0, skipped: 0, errors: [] };

  // 관리자 계정 (metrics.created_by용)
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
  if (periods.length === 0) return result;

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

  for (const cid of clientIds) {
    // computation이 있는 KPI만 조회
    const { data: kpiDefs } = await supabase
      .from("kpi_definitions")
      .select("metric_key, computation")
      .eq("client_id", cid)
      .not("computation", "is", null);

    if (!kpiDefs || kpiDefs.length === 0) {
      result.skipped++;
      continue;
    }

    for (const { period_start, period_end } of periods) {
      for (const kpi of kpiDefs as { metric_key: string; computation: KpiComputation }[]) {
        try {
          const value = await computeKpiValue(supabase, cid, kpi.computation, period_start, period_end);

          if (value === null) {
            result.skipped++;
            continue;
          }

          const rounded = Math.round(value * 10000) / 10000;

          const { data: existing } = await supabase
            .from("metrics")
            .select("id")
            .eq("client_id", cid)
            .eq("period_type", periodType)
            .eq("period_start", period_start)
            .eq("period_end", period_end)
            .eq("metric_key", kpi.metric_key)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from("metrics")
              .update({ value: rounded })
              .eq("id", existing.id);
            if (error) { result.errors.push(`update ${cid} ${kpi.metric_key}: ${error.message}`); continue; }
            result.updated++;
          } else {
            const { error } = await supabase.from("metrics").insert({
              client_id: cid,
              period_type: periodType,
              period_start,
              period_end,
              metric_key: kpi.metric_key,
              value: rounded,
              notes: "플랫폼 연동 자동 반영",
              visibility: "visible",
              created_by: createdBy,
            });
            if (error) { result.errors.push(`insert ${cid} ${kpi.metric_key}: ${error.message}`); continue; }
            result.inserted++;
          }
        } catch (err: unknown) {
          result.errors.push(`compute ${cid} ${kpi.metric_key}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  if (result.errors.length > 0) result.success = false;
  return result;
}
