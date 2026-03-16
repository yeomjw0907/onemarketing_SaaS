/**
 * TikTok Ads Marketing API 래퍼
 * - 인증: Bearer Access Token
 * - API: https://business-api.tiktok.com/open_api/v1.3
 */
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

const TIKTOK_ADS_BASE = "https://business-api.tiktok.com/open_api/v1.3";

interface TikTokAdsCredentials {
  accessToken: string;
  advertiserId: string;
}

/**
 * TikTok Ads API 공통 요청
 */
async function tiktokRequest(
  credentials: TikTokAdsCredentials,
  path: string,
  params: Record<string, string>,
): Promise<any> {
  const url = new URL(`${TIKTOK_ADS_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "X-BC-Request-ID": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 || res.status === 40001) {
    throw new Error(`TikTok Ads 인증 오류 (${res.status}): 액세스 토큰을 확인해 주세요.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TikTok Ads API 오류 ${res.status}: ${text}`);
  }

  const data = await res.json();

  // TikTok API는 HTTP 200이어도 code != 0이면 오류
  if (data.code !== undefined && data.code !== 0) {
    if (data.code === 40001 || data.code === 40004) {
      throw new Error(`TikTok Ads 인증 오류 (code ${data.code}): ${data.message || "액세스 토큰을 확인해 주세요."}`);
    }
    throw new Error(`TikTok Ads API 오류 (code ${data.code}): ${data.message || "알 수 없는 오류"}`);
  }

  return data;
}

/**
 * 어제 날짜 문자열 반환 (YYYY-MM-DD)
 */
function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * 연결 테스트 – 어제 날짜로 1건 조회
 */
export async function testTikTokAdsConnection(
  credentials: TikTokAdsCredentials,
): Promise<boolean> {
  try {
    const yesterday = getYesterday();
    await tiktokRequest(credentials, "/report/integrated/get/", {
      advertiser_id: credentials.advertiserId,
      report_type: "BASIC",
      dimensions: JSON.stringify(["stat_time_day"]),
      data_level: "AUCTION_ADVERTISER",
      metrics: JSON.stringify(["spend", "impressions", "clicks"]),
      start_date: yesterday,
      end_date: yesterday,
      page_size: "1",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * TikTok Ads 일별 통계 조회
 */
async function getTikTokStats(
  credentials: TikTokAdsCredentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  const data = await tiktokRequest(credentials, "/report/integrated/get/", {
    advertiser_id: credentials.advertiserId,
    report_type: "BASIC",
    dimensions: JSON.stringify(["stat_time_day"]),
    data_level: "AUCTION_ADVERTISER",
    metrics: JSON.stringify([
      "spend",
      "impressions",
      "clicks",
      "conversions",
      "ctr",
      "cpc",
    ]),
    start_date: dateFrom,
    end_date: dateTo,
    page_size: "1000",
  });

  return Array.isArray(data?.data?.list) ? data.data.list : [];
}

/**
 * TikTok Ads 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchTikTokAdsMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as TikTokAdsCredentials;
  if (!creds?.accessToken || !creds?.advertiserId) {
    throw new Error("TikTok Ads 인증 정보가 올바르지 않습니다. accessToken과 advertiserId를 확인해 주세요.");
  }

  const rawList = await getTikTokStats(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const entry of rawList) {
    // stat_time_day는 "YYYY-MM-DD HH:mm:ss" 형식일 수 있음
    const rawDate: string = entry.dimensions?.stat_time_day || dateFrom;
    const date = rawDate.slice(0, 10);  // YYYY-MM-DD 부분만 추출

    const m = entry.metrics || {};
    const metricMap: Record<string, number> = {
      cost: Number(m.spend || 0),
      impressions: Number(m.impressions || 0),
      clicks: Number(m.clicks || 0),
      conversions: Number(m.conversions || 0),
      ctr: Number(m.ctr || 0) * 100,    // 0-1 → 0-100 퍼센트
      cpc: Number(m.cpc || 0),
    };

    for (const [key, value] of Object.entries(metricMap)) {
      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: key,
        metric_value: value,
        dimensions: { advertiser_id: creds.advertiserId },
        raw_data: entry,
      });
    }
  }

  return results;
}
