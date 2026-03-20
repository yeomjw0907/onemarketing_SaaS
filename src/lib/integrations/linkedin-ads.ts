/**
 * LinkedIn Marketing API v202502 래퍼
 * - 인증: OAuth 2.0 (LinkedIn OAuth 2.0)
 * - API: LinkedIn Marketing API REST
 */
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = "202502";

interface LinkedInCredentials {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  adAccountId: string;
  adAccountUrn?: string;
  adAccountName?: string;
}

interface LinkedInAnalyticsElement {
  impressions?: number;
  clicks?: number;
  costInLocalCurrency?: string;
  totalEngagements?: number;
  externalWebsiteConversions?: number;
  dateRange?: {
    start: { year: number; month: number; day: number };
    end: { year: number; month: number; day: number };
  };
}

/**
 * LinkedIn OAuth 토큰 갱신
 */
async function refreshLinkedInToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LINKEDIN_CLIENT_ID 또는 LINKEDIN_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn 토큰 갱신 실패 ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in || 5184000,
  };
}

/**
 * 토큰이 만료되었거나 1시간 이내 만료 예정이면 갱신
 */
async function getValidAccessToken(
  creds: LinkedInCredentials,
  integrationId: string,
): Promise<string> {
  if (creds.tokenExpiresAt) {
    const expiresAt = new Date(creds.tokenExpiresAt).getTime();
    const oneHour = 60 * 60 * 1000;
    const needsRefresh = expiresAt - Date.now() < oneHour;

    if (needsRefresh && creds.refreshToken) {
      const newTokens = await refreshLinkedInToken(creds.refreshToken);
      const newExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000).toISOString();

      // data_integrations credentials 업데이트 (service client 없이 direct fetch로 업데이트)
      // 갱신된 토큰은 반환하여 사용하고, 별도 업데이트는 비동기로 처리
      try {
        const { createServiceClient } = await import("@/lib/supabase/server");
        const supabase = await createServiceClient();
        await supabase
          .from("data_integrations")
          .update({
            credentials: {
              ...creds,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              tokenExpiresAt: newExpiresAt,
            },
          })
          .eq("id", integrationId);
      } catch {
        // 업데이트 실패해도 갱신된 토큰으로 계속 진행
      }

      return newTokens.accessToken;
    }
  }

  return creds.accessToken;
}

/**
 * LinkedIn Marketing API 헤더 반환
 */
function linkedInHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

/**
 * LinkedIn Ad Analytics 조회
 */
async function getLinkedInAdAnalytics(
  accessToken: string,
  adAccountId: string,
  dateFrom: string,
  dateTo: string,
): Promise<LinkedInAnalyticsElement[]> {
  const [fromYear, fromMonth, fromDay] = dateFrom.split("-").map(Number);
  const [toYear, toMonth, toDay] = dateTo.split("-").map(Number);

  const params = new URLSearchParams({
    q: "analytics",
    pivot: "CAMPAIGN",
    "dateRange.start.year": String(fromYear),
    "dateRange.start.month": String(fromMonth),
    "dateRange.start.day": String(fromDay),
    "dateRange.end.year": String(toYear),
    "dateRange.end.month": String(toMonth),
    "dateRange.end.day": String(toDay),
    "accounts[0]": `urn:li:sponsoredAccount:${adAccountId}`,
    fields: "impressions,clicks,costInLocalCurrency,totalEngagements,externalWebsiteConversions,dateRange",
    timeGranularity: "DAILY",
  });

  const url = `${LINKEDIN_API_BASE}/adAnalytics?${params.toString()}`;
  const res = await fetch(url, { headers: linkedInHeaders(accessToken) });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn Analytics API Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.elements || [];
}

/**
 * LinkedIn 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchLinkedInAdsMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as LinkedInCredentials;
  if (!creds?.accessToken || !creds?.adAccountId) {
    throw new Error("LinkedIn 인증 정보가 올바르지 않습니다.");
  }

  const accessToken = await getValidAccessToken(creds, integration.id);
  const elements = await getLinkedInAdAnalytics(accessToken, creds.adAccountId, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const el of elements) {
    // 날짜 추출
    let date = dateFrom;
    if (el.dateRange?.start) {
      const { year, month, day } = el.dateRange.start;
      date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    const impressions = el.impressions ?? 0;
    const clicks = el.clicks ?? 0;
    // LinkedIn costInLocalCurrency는 실제 통화 단위 (마이크로 아님)
    const cost = parseFloat(el.costInLocalCurrency ?? "0") || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? cost / clicks : 0;
    const engagements = el.totalEngagements ?? 0;
    const conversions = el.externalWebsiteConversions ?? 0;

    const metricMap: Record<string, number> = {
      impressions,
      clicks,
      cost,
      ctr,
      cpc,
      engagements,
      conversions,
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
        raw_data: el as Record<string, unknown>,
      });
    }
  }

  return results;
}
