/**
 * GA4 Data API 래퍼
 * - 인증: OAuth 2.0 (Google Cloud Console)
 * - SDK: googleapis
 * - 설정: getAdminConfig()(DB 우선) → process.env
 */
import { google } from "googleapis";
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";
import { getAdminConfig } from "@/lib/admin-config";

interface GA4Credentials {
  refreshToken: string;
  propertyId: string;   // GA4 Property ID (e.g. "properties/123456789")
}

async function getOAuth2Client() {
  const config = await getAdminConfig();
  const baseUrl = config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`,
  );
}

/**
 * refresh_token으로 access_token 갱신
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const oauth2 = await getOAuth2Client();
  oauth2.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2.refreshAccessToken();
  return credentials.access_token!;
}

/**
 * 연결 테스트
 */
export async function testGA4Connection(credentials: GA4Credentials): Promise<boolean> {
  try {
    const accessToken = await getAccessToken(credentials.refreshToken);
    const propertyId = credentials.propertyId.replace("properties/", "");

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
          metrics: [{ name: "sessions" }],
          limit: 1,
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * GA4 속성(Property) 목록 가져오기
 */
export async function getGA4Properties(refreshToken: string) {
  const accessToken = await getAccessToken(refreshToken);

  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) throw new Error("GA4 속성 목록을 가져올 수 없습니다.");

  const data = await res.json();
  const properties: { id: string; name: string; account: string }[] = [];

  for (const account of data.accountSummaries || []) {
    for (const prop of account.propertySummaries || []) {
      properties.push({
        id: prop.property,
        name: prop.displayName,
        account: account.displayName,
      });
    }
  }
  return properties;
}

/**
 * GA4 Data API – 일별 트래픽 지표 조회
 */
async function queryGA4(
  credentials: GA4Credentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  const accessToken = await getAccessToken(credentials.refreshToken);
  const propertyId = credentials.propertyId.replace("properties/", "");

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: dateFrom, endDate: dateTo }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "newUsers" },
        ],
        orderBys: [{ dimension: { orderType: "ALPHANUMERIC", dimensionName: "date" } }],
        limit: 366,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 API Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.rows || [];
}

/**
 * GA4 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchGA4Metrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as GA4Credentials;
  if (!creds?.refreshToken || !creds?.propertyId) {
    throw new Error("GA4 인증 정보가 올바르지 않습니다.");
  }

  const rawRows = await queryGA4(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const row of rawRows) {
    const rawDate = row.dimensionValues?.[0]?.value || "";
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : dateFrom;

    const vals = row.metricValues || [];

    const metricMap: Record<string, number> = {
      sessions: Number(vals[0]?.value || 0),
      users: Number(vals[1]?.value || 0),
      pageviews: Number(vals[2]?.value || 0),
      bounce_rate: Number(vals[3]?.value || 0) * 100,
      avg_session_duration: Number(vals[4]?.value || 0),
      new_users: Number(vals[5]?.value || 0),
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
