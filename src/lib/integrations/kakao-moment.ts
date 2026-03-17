/**
 * 카카오모먼트 광고 API 래퍼
 * - 인증: Bearer Access Token
 * - API: https://apis.moment.kakao.com/openapi/v4
 */
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

const KAKAO_MOMENT_BASE = "https://apis.moment.kakao.com/openapi/v4";

interface KakaoMomentCredentials {
  accessToken: string;
  adAccountId: string;
}

interface KakaoMomentStatEntry {
  date?: string;
  imp?: number;
  click?: number;
  cost?: number;
  ctr?: number;
  cpc?: number;
  conversions?: number;
  [key: string]: unknown;
}

/**
 * 카카오모먼트 API 공통 요청
 */
async function kakaoMomentRequest(
  credentials: KakaoMomentCredentials,
  path: string,
  params?: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${KAKAO_MOMENT_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`카카오모먼트 인증 오류 (${res.status}): 액세스 토큰을 확인해 주세요.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`카카오모먼트 API 오류 ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * YYYYMMDD 형식으로 날짜 변환
 */
function toKakaoDate(date: string): string {
  return date.replace(/-/g, "");
}

/**
 * YYYYMMDD → YYYY-MM-DD 변환
 */
function fromKakaoDate(date: string): string {
  if (date.length === 8) {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }
  return date;
}

/**
 * 연결 테스트 – 광고계정 정보 조회
 */
export async function testKakaoMomentConnection(
  credentials: KakaoMomentCredentials,
): Promise<boolean> {
  try {
    await kakaoMomentRequest(
      credentials,
      `/adaccounts/${credentials.adAccountId}`,
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * 카카오모먼트 일별 광고 통계 조회
 */
async function getKakaoMomentStats(
  credentials: KakaoMomentCredentials,
  dateFrom: string,
  dateTo: string,
): Promise<KakaoMomentStatEntry[]> {
  const data = await kakaoMomentRequest(
    credentials,
    `/adaccounts/${credentials.adAccountId}/stats`,
    {
      datePreset: "CUSTOM",
      startDate: toKakaoDate(dateFrom),
      endDate: toKakaoDate(dateTo),
      timeUnit: "DAY",
    },
  );

  const typed = data as { data?: KakaoMomentStatEntry[] };
  return Array.isArray(typed?.data) ? typed.data! : [];
}

/**
 * 카카오모먼트 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchKakaoMomentMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as KakaoMomentCredentials;
  if (!creds?.accessToken || !creds?.adAccountId) {
    throw new Error("카카오모먼트 인증 정보가 올바르지 않습니다. accessToken과 adAccountId를 확인해 주세요.");
  }

  const rawStats = await getKakaoMomentStats(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const entry of rawStats) {
    const date = entry.date ? fromKakaoDate(String(entry.date)) : dateFrom;

    const metricMap: Record<string, number> = {
      impressions: Number(entry.impCnt || 0),
      clicks: Number(entry.clickCnt || 0),
      conversions: Number(entry.convCnt || 0),
      cost: Number(entry.cost || 0),
    };

    for (const [key, value] of Object.entries(metricMap)) {
      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: key,
        metric_value: value,
        dimensions: {},
        raw_data: entry,
      });
    }
  }

  return results;
}
