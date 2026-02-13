/**
 * Google Ads API 래퍼
 * - 인증: OAuth 2.0 (Google Cloud Console)
 * - SDK: googleapis (REST)
 */
import { google } from "googleapis";
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

interface GoogleAdsCredentials {
  refreshToken: string;
  customerId: string;       // Google Ads CID (e.g. "123-456-7890")
  developerToken: string;
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  );
}

/**
 * refresh_token으로 access_token 갱신
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();
  return credentials.access_token!;
}

/**
 * 연결 테스트
 */
export async function testGoogleAdsConnection(credentials: GoogleAdsCredentials): Promise<boolean> {
  try {
    const accessToken = await getAccessToken(credentials.refreshToken);
    const cid = credentials.customerId.replace(/-/g, "");

    const res = await fetch(
      `https://googleads.googleapis.com/v17/customers/${cid}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": credentials.developerToken,
        },
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Google Ads Query (GAQL)를 사용한 캠페인 성과 조회
 */
async function queryGoogleAds(
  credentials: GoogleAdsCredentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  const accessToken = await getAccessToken(credentials.refreshToken);
  const cid = credentials.customerId.replace(/-/g, "");

  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${cid}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": credentials.developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Ads API Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  // searchStream returns array of batches
  const rows: any[] = [];
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) rows.push(...batch.results);
    }
  }
  return rows;
}

/**
 * Google Ads 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchGoogleAdsMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as GoogleAdsCredentials;
  if (!creds?.refreshToken || !creds?.customerId) {
    throw new Error("Google Ads 인증 정보가 올바르지 않습니다.");
  }

  const rawRows = await queryGoogleAds(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const row of rawRows) {
    const date = row.segments?.date || dateFrom;
    const m = row.metrics || {};

    const metricMap: Record<string, number> = {
      impressions: Number(m.impressions || 0),
      clicks: Number(m.clicks || 0),
      cost: Number(m.costMicros || 0) / 1_000_000,  // micros → 원
      conversions: Number(m.conversions || 0),
      ctr: Number(m.ctr || 0) * 100,
      cpc: Number(m.averageCpc || 0) / 1_000_000,
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
        raw_data: row,
      });
    }
  }

  return results;
}
