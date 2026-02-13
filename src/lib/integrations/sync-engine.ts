/**
 * 동기화 엔진 – 모든 플랫폼의 공통 동기화 로직
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { DataIntegration, IntegrationPlatform } from "@/lib/types/database";
import { fetchNaverMetrics } from "./naver";
import { fetchMetaMetrics } from "./meta";
import { fetchGoogleAdsMetrics } from "./google-ads";
import { fetchGA4Metrics } from "./ga4";

export interface MetricRow {
  client_id: string;
  integration_id: string;
  platform: string;
  metric_date: string;
  metric_key: string;
  metric_value: number;
  dimensions: Record<string, unknown>;
  raw_data: Record<string, unknown>;
}

// 각 플랫폼별 fetcher 매핑
const PLATFORM_FETCHERS: Record<
  IntegrationPlatform,
  (integration: DataIntegration, dateFrom: string, dateTo: string) => Promise<MetricRow[]>
> = {
  naver_ads: fetchNaverMetrics,
  naver_searchad: fetchNaverMetrics,
  meta_ads: fetchMetaMetrics,
  google_ads: fetchGoogleAdsMetrics,
  google_analytics: fetchGA4Metrics,
};

/**
 * 단일 연동에 대한 동기화 실행
 */
export async function syncIntegration(
  supabase: SupabaseClient,
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<{ success: boolean; recordCount: number; error?: string }> {
  const fetcher = PLATFORM_FETCHERS[integration.platform];
  if (!fetcher) {
    return { success: false, recordCount: 0, error: `지원하지 않는 플랫폼: ${integration.platform}` };
  }

  // 동기화 로그 시작
  const { data: logEntry } = await supabase
    .from("integration_sync_logs")
    .insert({
      integration_id: integration.id,
      client_id: integration.client_id,
      platform: integration.platform,
      sync_type: "incremental" as const,
      status: "running" as const,
      records_synced: 0,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  try {
    const metrics = await fetcher(integration, dateFrom, dateTo);

    if (metrics.length > 0) {
      // 기존 데이터 삭제 후 새로 삽입 (upsert 대안)
      for (const m of metrics) {
        await supabase
          .from("platform_metrics")
          .delete()
          .eq("integration_id", m.integration_id)
          .eq("metric_date", m.metric_date)
          .eq("metric_key", m.metric_key);
      }

      // 배치 삽입 (500개 단위)
      for (let i = 0; i < metrics.length; i += 500) {
        const batch = metrics.slice(i, i + 500);
        await supabase.from("platform_metrics").insert(batch);
      }
    }

    // 연동 상태 업데이트
    await supabase
      .from("data_integrations")
      .update({
        status: "active",
        last_synced_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", integration.id);

    // 로그 성공
    if (logEntry) {
      await supabase
        .from("integration_sync_logs")
        .update({
          status: "success",
          records_synced: metrics.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return { success: true, recordCount: metrics.length };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);

    // 연동 에러 상태
    await supabase
      .from("data_integrations")
      .update({ status: "error", error_message: errorMsg })
      .eq("id", integration.id);

    // 로그 실패
    if (logEntry) {
      await supabase
        .from("integration_sync_logs")
        .update({
          status: "error",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return { success: false, recordCount: 0, error: errorMsg };
  }
}

/**
 * 모든 활성 연동에 대한 동기화 실행 (cron job에서 호출)
 */
export async function syncAllActive(
  supabase: SupabaseClient,
  dateFrom: string,
  dateTo: string,
) {
  const { data: integrations } = await supabase
    .from("data_integrations")
    .select("*")
    .in("status", ["active", "error"]);

  if (!integrations || integrations.length === 0) {
    return { total: 0, succeeded: 0, failed: 0, results: [] };
  }

  const results = [];
  let succeeded = 0;
  let failed = 0;

  for (const integration of integrations) {
    const result = await syncIntegration(supabase, integration, dateFrom, dateTo);
    results.push({ integrationId: integration.id, platform: integration.platform, ...result });
    if (result.success) succeeded++;
    else failed++;
  }

  return { total: integrations.length, succeeded, failed, results };
}
