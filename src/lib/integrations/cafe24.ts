/**
 * Cafe24 REST API 래퍼 (카페24)
 * - 인증: OAuth 2.0 (refresh token → access token 갱신)
 * - API: https://{mallId}.cafe24api.com/api/v2
 * - 지표: 주문 기반 revenue, orders (일별 합산)
 */
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

interface Cafe24Credentials {
  refreshToken: string;
  mallId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Cafe24 API 기본 URL 생성
 */
function getCafe24Base(mallId: string): string {
  return `https://${mallId}.cafe24api.com/api/v2`;
}

/**
 * refresh_token으로 access_token 갱신
 */
async function refreshCafe24Token(credentials: Cafe24Credentials): Promise<string> {
  const basicAuth = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");

  const res = await fetch(
    `https://${credentials.mallId}.cafe24api.com/api/v2/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
      }).toString(),
    },
  );

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Cafe24 인증 오류 (${res.status}): 리프레시 토큰 또는 클라이언트 정보를 확인해 주세요.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cafe24 토큰 갱신 오류 ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Cafe24 토큰 갱신 실패: access_token을 받지 못했습니다.");
  }

  return data.access_token;
}

/**
 * Cafe24 API 공통 요청
 */
async function cafe24Request(
  accessToken: string,
  mallId: string,
  path: string,
  params?: Record<string, string>,
): Promise<any> {
  const url = new URL(`${getCafe24Base(mallId)}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Cafe24 API 인증 오류 (${res.status}): 액세스 토큰이 만료되었거나 권한이 없습니다.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cafe24 API 오류 ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * 연결 테스트 – 쇼핑몰 기본 정보 조회
 */
export async function testCafe24Connection(
  credentials: Cafe24Credentials,
): Promise<boolean> {
  try {
    const accessToken = await refreshCafe24Token(credentials);
    await cafe24Request(accessToken, credentials.mallId, "/shop");
    return true;
  } catch {
    return false;
  }
}

/**
 * 주문 전체 조회 (페이지네이션 포함)
 */
async function getAllCafe24Orders(
  accessToken: string,
  credentials: Cafe24Credentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  const allOrders: any[] = [];
  const limit = 500;
  let offset = 0;

  while (true) {
    const data = await cafe24Request(
      accessToken,
      credentials.mallId,
      "/orders",
      {
        start_date: dateFrom,
        end_date: dateTo,
        limit: String(limit),
        offset: String(offset),
      },
    );

    const orders = Array.isArray(data?.orders) ? data.orders : [];
    if (orders.length === 0) break;

    allOrders.push(...orders);

    // 반환된 건수가 limit보다 작으면 마지막 페이지
    if (orders.length < limit) break;
    offset += limit;
  }

  return allOrders;
}

/**
 * 주문 목록을 날짜별로 집계
 */
function aggregateOrdersByDate(orders: any[]): Map<string, { revenue: number; orders: number }> {
  const byDate = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders) {
    if (!order.order_date) continue;
    // order_date는 "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm:ss+09:00" 형식일 수 있음
    const date = order.order_date.slice(0, 10);
    const price = Number(order.total_price || 0);

    const existing = byDate.get(date) || { revenue: 0, orders: 0 };
    byDate.set(date, {
      revenue: existing.revenue + price,
      orders: existing.orders + 1,
    });
  }

  return byDate;
}

/**
 * Cafe24 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchCafe24Metrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as Cafe24Credentials;
  if (!creds?.refreshToken || !creds?.mallId || !creds?.clientId || !creds?.clientSecret) {
    throw new Error("Cafe24 인증 정보가 올바르지 않습니다. refreshToken, mallId, clientId, clientSecret을 확인해 주세요.");
  }

  // access_token 갱신
  const accessToken = await refreshCafe24Token(creds);

  // 주문 데이터 조회
  const orders = await getAllCafe24Orders(accessToken, creds, dateFrom, dateTo);
  const aggregated = aggregateOrdersByDate(orders);
  const results: MetricRow[] = [];

  for (const [date, stats] of aggregated.entries()) {
    const metricMap: Record<string, number> = {
      revenue: stats.revenue,
      orders: stats.orders,
    };

    for (const [key, value] of Object.entries(metricMap)) {
      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: key,
        metric_value: value,
        dimensions: { mall_id: creds.mallId },
        raw_data: { date, ...stats },
      });
    }
  }

  // 방문자 통계 시도 (403이면 조용히 건너뜀)
  try {
    const visitorData = await cafe24Request(
      accessToken,
      creds.mallId,
      "/analytics/visitor_stats",
      { start_date: dateFrom, end_date: dateTo },
    );

    const visitorRows = Array.isArray(visitorData?.visitor_stats)
      ? visitorData.visitor_stats
      : Array.isArray(visitorData)
        ? visitorData
        : [];

    for (const row of visitorRows) {
      const date = (row.date || row.stat_date || "").slice(0, 10);
      if (!date) continue;

      results.push({
        client_id: integration.client_id,
        integration_id: integration.id,
        platform: integration.platform,
        metric_date: date,
        metric_key: "visitors",
        metric_value: Number(row.visitors || row.visitor_count || 0),
        dimensions: { mall_id: creds.mallId },
        raw_data: row,
      });
    }
  } catch (err: any) {
    // 방문자 통계는 기본 플랜에서 제공되지 않을 수 있음 – 무시
    const status = err?.message?.match(/\d{3}/)?.[0];
    if (status !== "403" && status !== "404") {
      // 403/404 이외의 오류는 로그만 남기고 계속 진행
      console.warn("Cafe24 방문자 통계 조회 실패 (무시됨):", err?.message);
    }
  }

  return results;
}
