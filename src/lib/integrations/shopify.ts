/**
 * Shopify Admin REST API 래퍼
 * - 인증: X-Shopify-Access-Token 헤더
 * - API: https://{shopDomain}/admin/api/2024-01
 * - 지표: 주문 기반 revenue, orders (일별 합산)
 */
import { DataIntegration } from "@/lib/types/database";
import type { MetricRow } from "./sync-engine";

interface ShopifyCredentials {
  accessToken: string;
  shopDomain: string;  // e.g. "mystore.myshopify.com"
}

/**
 * Shopify API 기본 URL 생성
 */
function getShopifyBase(shopDomain: string): string {
  return `https://${shopDomain}/admin/api/2024-01`;
}

/**
 * Shopify API 공통 요청
 */
async function shopifyRequest(
  credentials: ShopifyCredentials,
  path: string,
  params?: Record<string, string>,
): Promise<{ data: any; linkHeader: string | null }> {
  const url = new URL(`${getShopifyBase(credentials.shopDomain)}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": credentials.accessToken,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`Shopify 인증 오류 (${res.status}): 액세스 토큰 또는 쇼핑몰 도메인을 확인해 주세요.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API 오류 ${res.status}: ${text}`);
  }

  const data = await res.json();
  const linkHeader = res.headers.get("Link");
  return { data, linkHeader };
}

/**
 * Link 헤더에서 next 페이지 URL 추출
 */
function extractNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

/**
 * 연결 테스트 – 쇼핑몰 기본 정보 조회
 */
export async function testShopifyConnection(
  credentials: ShopifyCredentials,
): Promise<boolean> {
  try {
    await shopifyRequest(credentials, "/shop.json");
    return true;
  } catch {
    return false;
  }
}

/**
 * 주문 전체 조회 (페이지네이션 포함)
 */
async function getAllOrders(
  credentials: ShopifyCredentials,
  dateFrom: string,
  dateTo: string,
): Promise<any[]> {
  const allOrders: any[] = [];

  // 첫 번째 요청
  let { data, linkHeader } = await shopifyRequest(credentials, "/orders.json", {
    created_at_min: `${dateFrom}T00:00:00+09:00`,
    created_at_max: `${dateTo}T23:59:59+09:00`,
    status: "any",
    limit: "250",
    fields: "id,total_price,created_at,financial_status",
  });

  if (Array.isArray(data?.orders)) {
    allOrders.push(...data.orders);
  }

  // Link 헤더를 통한 페이지네이션
  let nextUrl = extractNextPageUrl(linkHeader);
  while (nextUrl) {
    const res = await fetch(nextUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": credentials.accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) break;

    const pageData = await res.json();
    if (Array.isArray(pageData?.orders)) {
      allOrders.push(...pageData.orders);
    }

    nextUrl = extractNextPageUrl(res.headers.get("Link"));
  }

  return allOrders;
}

/**
 * 주문 목록을 날짜별로 집계
 */
function aggregateOrdersByDate(orders: any[]): Map<string, { revenue: number; orders: number }> {
  const byDate = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders) {
    if (!order.created_at) continue;
    const date = order.created_at.slice(0, 10);  // YYYY-MM-DD
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
 * Shopify 지표를 공통 MetricRow 형식으로 변환
 */
export async function fetchShopifyMetrics(
  integration: DataIntegration,
  dateFrom: string,
  dateTo: string,
): Promise<MetricRow[]> {
  const creds = integration.credentials as unknown as ShopifyCredentials;
  if (!creds?.accessToken || !creds?.shopDomain) {
    throw new Error("Shopify 인증 정보가 올바르지 않습니다. accessToken과 shopDomain을 확인해 주세요.");
  }

  const orders = await getAllOrders(creds, dateFrom, dateTo);
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
        dimensions: { shop_domain: creds.shopDomain },
        raw_data: { date, ...stats },
      });
    }
  }

  return results;
}
