/**
 * Meta Ads (Facebook/Instagram) API 래퍼
 * - 인증: OAuth 2.0 (Facebook Login)
 * - API: Marketing API v21.0
 */
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

interface MetaCredentials {
  accessToken: string;
  adAccountId: string;
  tokenExpiresAt?: string;  // ISO date
}

/**
 * Meta Graph API 요청
 */
async function metaRequest(
  accessToken: string,
  path: string,
  params?: Record<string, string>,
): Promise<any> {
  const url = new URL(`${META_GRAPH_URL}${path}`);
  url.searchParams.set("access_token", accessToken);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Meta API Error ${res.status}: ${body?.error?.message || res.statusText}`,
    );
  }
  return res.json();
}

/**
 * Short-lived token → Long-lived token 교환
 */
export async function exchangeLongLivedToken(
  appId: string,
  appSecret: string,
  shortLivedToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const data = await metaRequest("", "/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // ~60일
  };
}

/**
 * 연결 테스트 – Ad Account 정보 조회
 */
export async function testMetaConnection(credentials: MetaCredentials): Promise<boolean> {
  try {
    const acctId = credentials.adAccountId.startsWith("act_")
      ? credentials.adAccountId
      : `act_${credentials.adAccountId}`;
    await metaRequest(credentials.accessToken, `/${acctId}`, {
      fields: "name,account_status",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ad Account 목록 가져오기
 */
export async function getMetaAdAccounts(accessToken: string) {
  const data = await metaRequest(accessToken, "/me/adaccounts", {
    fields: "id,name,account_status,currency",
    limit: "100",
  });
  return data?.data || [];
}

/**
 * Insights API 호출 – 일별 지표
 */
async function getMetaInsights(
  credentials: MetaCredentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  const acctId = credentials.adAccountId.startsWith("act_")
    ? credentials.adAccountId
    : `act_${credentials.adAccountId}`;

  const data = await metaRequest(credentials.accessToken, `/${acctId}/insights`, {
    fields: "impressions,clicks,spend,cpc,cpm,ctr,actions,reach",
    time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
    time_increment: "1", // daily
    level: "account",
    limit: "500",
  });

  return data?.data || [];
}

/**
 * Meta 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchMetaMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as MetaCredentials;
  if (!creds?.accessToken || !creds?.adAccountId) {
    throw new Error("Meta 인증 정보가 올바르지 않습니다.");
  }

  const rawInsights = await getMetaInsights(creds, dateFrom, dateTo);
  const results: MetricRow[] = [];

  for (const entry of rawInsights) {
    const date = entry.date_start || dateFrom;

    // conversions: actions 배열에서 추출
    let conversions = 0;
    if (entry.actions) {
      const purchaseAction = entry.actions.find(
        (a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase",
      );
      conversions = purchaseAction ? Number(purchaseAction.value) : 0;
    }

    const metricMap: Record<string, number> = {
      impressions: Number(entry.impressions || 0),
      clicks: Number(entry.clicks || 0),
      cost: Number(entry.spend || 0),
      ctr: Number(entry.ctr || 0),
      cpc: Number(entry.cpc || 0),
      cpm: Number(entry.cpm || 0),
      reach: Number(entry.reach || 0),
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
        raw_data: entry,
      });
    }
  }

  return results;
}
