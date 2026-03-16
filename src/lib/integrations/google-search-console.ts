/**
 * Google Search Console API 래퍼
 * - 인증: OAuth 2.0 (refresh token → access token)
 * - SDK: googleapis
 * - API: https://searchconsole.googleapis.com/webmasters/v3
 */
import { google } from "googleapis";
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";
import { getAdminConfig } from "@/lib/admin-config";

interface SearchConsoleCredentials {
  refreshToken: string;
  siteUrl: string;  // e.g. "https://example.com/"
}

/**
 * OAuth2 클라이언트 생성
 */
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
  if (!credentials.access_token) {
    throw new Error("Google Search Console: 액세스 토큰 갱신에 실패했습니다.");
  }
  return credentials.access_token;
}

/**
 * Search Analytics 쿼리 실행
 */
async function querySearchConsole(
  credentials: SearchConsoleCredentials,
  startDate: string,
  endDate: string,
  rowLimit: number = 365,
): Promise<any[]> {
  const accessToken = await getAccessToken(credentials.refreshToken);
  const encodedSiteUrl = encodeURIComponent(credentials.siteUrl);

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["date"],
        rowLimit,
      }),
    },
  );

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Google Search Console 인증 오류 (${res.status}): 리프레시 토큰 또는 사이트 권한을 확인해 주세요.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Search Console API 오류 ${res.status}: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data?.rows) ? data.rows : [];
}

/**
 * 연결 테스트 – 어제 날짜로 1건 조회
 */
export async function testSearchConsoleConnection(
  credentials: SearchConsoleCredentials,
): Promise<boolean> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    await querySearchConsole(credentials, dateStr, dateStr, 1);
    return true;
  } catch {
    return false;
  }
}

/**
 * Google Search Console 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchSearchConsoleMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as SearchConsoleCredentials;
  if (!creds?.refreshToken || !creds?.siteUrl) {
    throw new Error("Google Search Console 인증 정보가 올바르지 않습니다. refreshToken과 siteUrl을 확인해 주세요.");
  }

  const rawRows = await querySearchConsole(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const row of rawRows) {
    // keys[0]은 date 차원 (YYYY-MM-DD)
    const date = Array.isArray(row.keys) && row.keys[0] ? row.keys[0] : dateFrom;

    const metricMap: Record<string, number> = {
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0) * 100,      // 0-1 범위를 0-100 퍼센트로 변환
      position: Number(row.position || 0),
    };

    for (const [key, value] of Object.entries(metricMap)) {
      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: key,
        metric_value: value,
        dimensions: { site_url: creds.siteUrl },
        raw_data: row,
      });
    }
  }

  return results;
}
