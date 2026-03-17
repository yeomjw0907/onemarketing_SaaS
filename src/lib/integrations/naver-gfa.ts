/**
 * 네이버 GFA (성과형 디스플레이광고) API 래퍼
 * - 인증: HMAC-SHA256 서명 (X-Timestamp, X-API-KEY, X-Customer, X-Signature)
 * - API: https://gfaapi.naver.com
 */
import crypto from "crypto";
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

const NAVER_GFA_BASE = "https://gfaapi.naver.com";

interface NaverGFACredentials {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

interface NaverGFAStatEntry {
  date?: string;
  impressions?: number;
  clicks?: number;
  cost?: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  [key: string]: unknown;
}

/**
 * HMAC-SHA256 서명 생성
 * 메시지 형식: "{timestamp}.GET.{path}"
 */
function generateGFASignature(
  timestamp: string,
  method: string,
  path: string,
  secretKey: string,
): string {
  const message = `${timestamp}.${method}.${path}`;
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

/**
 * 네이버 GFA API 공통 요청
 */
async function naverGFARequest(
  credentials: NaverGFACredentials,
  method: string,
  path: string,
  params?: Record<string, string>,
): Promise<unknown> {
  const timestamp = String(Date.now());
  const signature = generateGFASignature(timestamp, method, path, credentials.secretKey);

  const url = new URL(`${NAVER_GFA_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": credentials.apiKey,
      "X-Customer": credentials.customerId,
      "X-Signature": signature,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`네이버 GFA 인증 오류 (${res.status}): API 키와 서명을 확인해 주세요.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`네이버 GFA API 오류 ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * YYYY-MM-DD → YYYYMMDD 변환
 */
function toGFADate(date: string): string {
  return date.replace(/-/g, "");
}

/**
 * YYYYMMDD → YYYY-MM-DD 변환
 */
function fromGFADate(date: string): string {
  if (date.length === 8) {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }
  return date;
}

/**
 * 연결 테스트 – 광고주 계정 정보 조회
 */
export async function testNaverGFAConnection(
  credentials: NaverGFACredentials,
): Promise<boolean> {
  try {
    await naverGFARequest(
      credentials,
      "GET",
      `/accounts/${credentials.customerId}`,
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * 네이버 GFA 캠페인 일별 통계 조회
 */
async function getNaverGFAStats(
  credentials: NaverGFACredentials,
  dateFrom: string,
  dateTo: string,
): Promise<NaverGFAStatEntry[]> {
  const data = await naverGFARequest(
    credentials,
    "GET",
    `/stats/accounts/${credentials.customerId}/campaigns`,
    {
      startDate: toGFADate(dateFrom),
      endDate: toGFADate(dateTo),
      timeUnit: "DAY",
    },
  );

  if (Array.isArray(data)) return data as NaverGFAStatEntry[];
  const typed = data as { data?: NaverGFAStatEntry[] };
  return Array.isArray(typed?.data) ? typed.data! : [];
}

/**
 * 네이버 GFA 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchNaverGFAMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as NaverGFACredentials;
  if (!creds?.apiKey || !creds?.secretKey || !creds?.customerId) {
    throw new Error("네이버 GFA 인증 정보가 올바르지 않습니다. apiKey, secretKey, customerId를 확인해 주세요.");
  }

  const rawStats = await getNaverGFAStats(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const entry of rawStats) {
    const date = entry.statDt ? fromGFADate(String(entry.statDt)) : dateFrom;

    const metricMap: Record<string, number> = {
      impressions: Number(entry.impCnt || 0),
      clicks: Number(entry.clkCnt || 0),
      conversions: Number(entry.convCnt || 0),
      cost: Number(entry.salesAmt || 0),
    };

    for (const [key, value] of Object.entries(metricMap)) {
      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: key,
        metric_value: value,
        dimensions: { customer_id: creds.customerId },
        raw_data: entry,
      });
    }
  }

  return results;
}
