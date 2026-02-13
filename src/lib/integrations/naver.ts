/**
 * 네이버 검색광고 API 래퍼
 * - 인증: API Key + Secret Key + Customer ID (HMAC-SHA256 서명)
 * - API: https://api.searchad.naver.com
 */
import crypto from "crypto";
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

const NAVER_API_BASE = "https://api.searchad.naver.com";

interface NaverCredentials {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

/**
 * HMAC-SHA256 서명 생성
 */
function generateSignature(
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
 * 네이버 검색광고 API 요청
 */
async function naverRequest(
  credentials: NaverCredentials,
  method: string,
  path: string,
  params?: Record<string, string>,
): Promise<any> {
  const timestamp = String(Date.now());
  const signature = generateSignature(timestamp, method, path, credentials.secretKey);

  const url = new URL(`${NAVER_API_BASE}${path}`);
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver API Error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * 연결 테스트 – 마스터 리포트 목록 조회
 */
export async function testNaverConnection(credentials: NaverCredentials): Promise<boolean> {
  try {
    await naverRequest(credentials, "GET", "/ncc/campaigns");
    return true;
  } catch {
    return false;
  }
}

/**
 * 캠페인 목록 조회
 */
export async function getNaverCampaigns(credentials: NaverCredentials) {
  return naverRequest(credentials, "GET", "/ncc/campaigns");
}

/**
 * 통계 데이터 조회 (Stats API)
 */
async function getNaverStats(
  credentials: NaverCredentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  // 먼저 캠페인 목록 가져오기
  const campaigns = await getNaverCampaigns(credentials);
  if (!campaigns || campaigns.length === 0) return [];

  const campaignIds = campaigns.map((c: any) => c.nccCampaignId);

  // 마스터 리포트 요청
  const statData = await naverRequest(
    credentials,
    "GET",
    "/stats",
    {
      ids: campaignIds.join(","),
      fields: JSON.stringify([
        "impCnt", "clkCnt", "salesAmt", "ctr", "cpc", "ccnt",
      ]),
      timeRange: JSON.stringify({
        since: dateFrom.replace(/-/g, ""),
        until: dateTo.replace(/-/g, ""),
      }),
      datePreset: "custom",
      timeIncrement: "1",  // daily
    },
  );

  return Array.isArray(statData) ? statData : statData?.data || [];
}

/**
 * 네이버 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchNaverMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as NaverCredentials;
  if (!creds?.apiKey || !creds?.secretKey || !creds?.customerId) {
    throw new Error("네이버 검색광고 인증 정보가 올바르지 않습니다.");
  }

  const rawStats = await getNaverStats(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const entry of rawStats) {
    const date = entry.statDt
      ? `${entry.statDt.slice(0, 4)}-${entry.statDt.slice(4, 6)}-${entry.statDt.slice(6, 8)}`
      : dateFrom;

    const metricMap: Record<string, number> = {
      impressions: entry.impCnt || 0,
      clicks: entry.clkCnt || 0,
      cost: entry.salesAmt || 0,
      ctr: entry.ctr || 0,
      cpc: entry.cpc || 0,
      conversions: entry.ccnt || 0,
    };

    for (const [key, value] of Object.entries(metricMap)) {
      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: key,
        metric_value: value,
        dimensions: { campaign_id: entry.id || "" },
        raw_data: entry,
      });
    }
  }

  return results;
}
