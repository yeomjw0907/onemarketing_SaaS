/**
 * KPI 템플릿
 * - KPI_TEMPLATES: 업종별 (클라이언트 생성 시 수동 입력 KPI 세트)
 * - PLATFORM_KPI_TEMPLATES: 플랫폼별 (연동 추가 시 자동 집계 KPI 세트)
 */
import type { IntegrationPlatform, KpiComputation, KpiFormat } from "./types/database";

export interface KpiTemplateItem {
  metric_key: string;
  metric_label: string;
  unit: string;
  show_on_overview: boolean;
  overview_order: number;
  chart_enabled: boolean;
  description: string;
  validation_rule: { required: boolean; integer?: boolean; min?: number };
}

export interface KpiTemplate {
  key: string;
  label: string;
  description: string;
  icon: string;
  kpis: KpiTemplateItem[];
}

export const KPI_TEMPLATES: KpiTemplate[] = [
  {
    key: "ecommerce",
    label: "이커머스 / 쇼핑몰",
    description: "온라인 쇼핑몰, 스마트스토어 광고주",
    icon: "🛒",
    kpis: [
      { metric_key: "roas", metric_label: "ROAS", unit: "%", show_on_overview: true, overview_order: 1, chart_enabled: true, description: "광고비 대비 매출액 (매출÷광고비×100)", validation_rule: { required: true, min: 0 } },
      { metric_key: "ad_spend", metric_label: "광고비", unit: "원", show_on_overview: true, overview_order: 2, chart_enabled: true, description: "총 광고비 지출", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "revenue", metric_label: "광고 매출", unit: "원", show_on_overview: true, overview_order: 3, chart_enabled: true, description: "광고로 발생한 매출", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "orders", metric_label: "주문 수", unit: "건", show_on_overview: true, overview_order: 4, chart_enabled: true, description: "광고로 발생한 주문 수", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "cpa", metric_label: "CPA", unit: "원", show_on_overview: false, overview_order: 5, chart_enabled: false, description: "건당 전환 비용", validation_rule: { required: false, min: 0 } },
      { metric_key: "clicks", metric_label: "클릭 수", unit: "회", show_on_overview: false, overview_order: 6, chart_enabled: false, description: "광고 클릭 수", validation_rule: { required: false, integer: true, min: 0 } },
      { metric_key: "impressions", metric_label: "노출 수", unit: "회", show_on_overview: false, overview_order: 7, chart_enabled: false, description: "광고 노출 수", validation_rule: { required: false, integer: true, min: 0 } },
    ],
  },
  {
    key: "restaurant",
    label: "음식점 / F&B",
    description: "식당, 카페, 배달 업종 광고주",
    icon: "🍽️",
    kpis: [
      { metric_key: "ad_spend", metric_label: "광고비", unit: "원", show_on_overview: true, overview_order: 1, chart_enabled: true, description: "총 광고비 지출", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "reservations", metric_label: "예약/방문 수", unit: "건", show_on_overview: true, overview_order: 2, chart_enabled: true, description: "광고로 발생한 예약 또는 방문 수", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "reviews", metric_label: "리뷰 수", unit: "개", show_on_overview: true, overview_order: 3, chart_enabled: true, description: "신규 리뷰 수", validation_rule: { required: false, integer: true, min: 0 } },
      { metric_key: "cpc", metric_label: "클릭당 비용 (CPC)", unit: "원", show_on_overview: false, overview_order: 4, chart_enabled: false, description: "클릭 1회당 비용", validation_rule: { required: false, min: 0 } },
      { metric_key: "clicks", metric_label: "클릭 수", unit: "회", show_on_overview: false, overview_order: 5, chart_enabled: false, description: "광고 클릭 수", validation_rule: { required: false, integer: true, min: 0 } },
    ],
  },
  {
    key: "clinic",
    label: "병원 / 의원 / 클리닉",
    description: "피부과, 성형외과, 치과, 한의원 등",
    icon: "🏥",
    kpis: [
      { metric_key: "ad_spend", metric_label: "광고비", unit: "원", show_on_overview: true, overview_order: 1, chart_enabled: true, description: "총 광고비 지출", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "inquiries", metric_label: "상담 문의 수", unit: "건", show_on_overview: true, overview_order: 2, chart_enabled: true, description: "전화·카카오·폼 상담 문의 합계", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "cpl", metric_label: "CPL (문의당 비용)", unit: "원", show_on_overview: true, overview_order: 3, chart_enabled: false, description: "문의 1건당 비용", validation_rule: { required: false, min: 0 } },
      { metric_key: "appointments", metric_label: "예약 전환 수", unit: "건", show_on_overview: true, overview_order: 4, chart_enabled: true, description: "상담 후 실제 예약된 수", validation_rule: { required: false, integer: true, min: 0 } },
      { metric_key: "clicks", metric_label: "클릭 수", unit: "회", show_on_overview: false, overview_order: 5, chart_enabled: false, description: "광고 클릭 수", validation_rule: { required: false, integer: true, min: 0 } },
    ],
  },
  {
    key: "b2b",
    label: "B2B / 서비스업",
    description: "법무, 컨설팅, IT, 교육 등 B2B 업종",
    icon: "💼",
    kpis: [
      { metric_key: "ad_spend", metric_label: "광고비", unit: "원", show_on_overview: true, overview_order: 1, chart_enabled: true, description: "총 광고비 지출", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "leads", metric_label: "리드 수", unit: "건", show_on_overview: true, overview_order: 2, chart_enabled: true, description: "문의, 견적 요청, 가입 등 리드 수", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "cpl", metric_label: "CPL (리드당 비용)", unit: "원", show_on_overview: true, overview_order: 3, chart_enabled: false, description: "리드 1건당 비용", validation_rule: { required: false, min: 0 } },
      { metric_key: "conversion_rate", metric_label: "전환율", unit: "%", show_on_overview: false, overview_order: 4, chart_enabled: false, description: "클릭 대비 리드 전환율", validation_rule: { required: false, min: 0 } },
      { metric_key: "clicks", metric_label: "클릭 수", unit: "회", show_on_overview: false, overview_order: 5, chart_enabled: false, description: "광고 클릭 수", validation_rule: { required: false, integer: true, min: 0 } },
    ],
  },
  {
    key: "realestate",
    label: "부동산 / 인테리어",
    description: "공인중개사, 인테리어, 건설 업종",
    icon: "🏠",
    kpis: [
      { metric_key: "ad_spend", metric_label: "광고비", unit: "원", show_on_overview: true, overview_order: 1, chart_enabled: true, description: "총 광고비 지출", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "inquiries", metric_label: "문의 수", unit: "건", show_on_overview: true, overview_order: 2, chart_enabled: true, description: "전화·폼 문의 합계", validation_rule: { required: true, integer: true, min: 0 } },
      { metric_key: "cpl", metric_label: "문의당 비용", unit: "원", show_on_overview: true, overview_order: 3, chart_enabled: false, description: "문의 1건당 비용", validation_rule: { required: false, min: 0 } },
      { metric_key: "site_visits", metric_label: "사이트 방문자", unit: "명", show_on_overview: false, overview_order: 4, chart_enabled: true, description: "광고로 유입된 방문자", validation_rule: { required: false, integer: true, min: 0 } },
    ],
  },
  {
    key: "custom",
    label: "직접 설정",
    description: "KPI를 처음부터 직접 설정합니다",
    icon: "⚙️",
    kpis: [],
  },
];

export function getTemplateByKey(key: string): KpiTemplate | undefined {
  return KPI_TEMPLATES.find((t) => t.key === key);
}

// ═══════════════════════════════════════════════════════════════════════════
// 플랫폼 연동 KPI 자동 집계 템플릿
// ═══════════════════════════════════════════════════════════════════════════

export interface PlatformKpiTemplate {
  metric_key: string;
  metric_label: string;
  unit: string;
  format: KpiFormat;
  higher_is_better: boolean;
  show_on_overview: boolean;
  chart_enabled: boolean;
  computation: KpiComputation;
}

function src(platform: IntegrationPlatform | "*", metric: string) {
  return { platform, metric };
}

function psum(platform: IntegrationPlatform | "*", metric: string): KpiComputation {
  return { type: "sum", sources: [src(platform, metric)] };
}
function pavg(platform: IntegrationPlatform | "*", metric: string): KpiComputation {
  return { type: "avg", sources: [src(platform, metric)] };
}
function pratio(
  np: IntegrationPlatform | "*", nm: string,
  dp: IntegrationPlatform | "*", dm: string,
): KpiComputation {
  return { type: "ratio", numerator: [src(np, nm)], denominator: [src(dp, dm)] };
}

// ─── Meta Ads ───────────────────────────────────────────────────────────────
const META: PlatformKpiTemplate[] = [
  { metric_key: "meta_spend",       metric_label: "Meta 광고비",    unit: "원", format: "currency",   higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: psum("meta_ads", "cost") },
  { metric_key: "meta_impressions", metric_label: "Meta 노출수",    unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: true,  computation: psum("meta_ads", "impressions") },
  { metric_key: "meta_clicks",      metric_label: "Meta 클릭수",    unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("meta_ads", "clicks") },
  { metric_key: "meta_reach",       metric_label: "Meta 도달수",    unit: "명", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("meta_ads", "reach") },
  { metric_key: "meta_conversions", metric_label: "Meta 전환수",    unit: "건", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("meta_ads", "conversions") },
  { metric_key: "meta_ctr",         metric_label: "Meta CTR",       unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("meta_ads","clicks","meta_ads","impressions") },
  { metric_key: "meta_cpc",         metric_label: "Meta CPC",       unit: "원", format: "currency",   higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pratio("meta_ads","cost","meta_ads","clicks") },
  { metric_key: "meta_cpm",         metric_label: "Meta CPM",       unit: "원", format: "currency",   higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pavg("meta_ads", "cpm") },
];

// ─── Google Ads ─────────────────────────────────────────────────────────────
const GADS: PlatformKpiTemplate[] = [
  { metric_key: "gads_spend",       metric_label: "Google 광고비",  unit: "원", format: "currency",   higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: psum("google_ads", "cost") },
  { metric_key: "gads_impressions", metric_label: "Google 노출수",  unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: true,  computation: psum("google_ads", "impressions") },
  { metric_key: "gads_clicks",      metric_label: "Google 클릭수",  unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("google_ads", "clicks") },
  { metric_key: "gads_conversions", metric_label: "Google 전환수",  unit: "건", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("google_ads", "conversions") },
  { metric_key: "gads_ctr",         metric_label: "Google CTR",     unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("google_ads","clicks","google_ads","impressions") },
  { metric_key: "gads_cpc",         metric_label: "Google CPC",     unit: "원", format: "currency",   higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pratio("google_ads","cost","google_ads","clicks") },
];

// ─── Google Analytics 4 ─────────────────────────────────────────────────────
const GA4: PlatformKpiTemplate[] = [
  { metric_key: "ga4_sessions",        metric_label: "세션수",          unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("google_analytics", "sessions") },
  { metric_key: "ga4_users",           metric_label: "사용자수",        unit: "명", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("google_analytics", "users") },
  { metric_key: "ga4_new_users",       metric_label: "신규 방문자",     unit: "명", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("google_analytics", "new_users") },
  { metric_key: "ga4_pageviews",       metric_label: "페이지뷰",        unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: true,  computation: psum("google_analytics", "pageviews") },
  { metric_key: "ga4_bounce_rate",     metric_label: "이탈률",          unit: "%",  format: "percentage", higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pavg("google_analytics", "bounce_rate") },
  { metric_key: "ga4_avg_session_dur", metric_label: "평균 세션 시간",  unit: "초", format: "duration",   higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pavg("google_analytics", "avg_session_duration") },
];

// ─── Naver Ads ───────────────────────────────────────────────────────────────
const NAVER: PlatformKpiTemplate[] = [
  { metric_key: "naver_spend",       metric_label: "네이버 광고비",  unit: "원", format: "currency",   higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: psum("naver_ads", "cost") },
  { metric_key: "naver_impressions", metric_label: "네이버 노출수",  unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("naver_ads", "impressions") },
  { metric_key: "naver_clicks",      metric_label: "네이버 클릭수",  unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("naver_ads", "clicks") },
  { metric_key: "naver_conversions", metric_label: "네이버 전환수",  unit: "건", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("naver_ads", "conversions") },
  { metric_key: "naver_ctr",         metric_label: "네이버 CTR",     unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("naver_ads","clicks","naver_ads","impressions") },
  { metric_key: "naver_cpc",         metric_label: "네이버 CPC",     unit: "원", format: "currency",   higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pratio("naver_ads","cost","naver_ads","clicks") },
];

// ─── Kakao Moment ────────────────────────────────────────────────────────────
const KAKAO: PlatformKpiTemplate[] = [
  { metric_key: "kakao_spend",       metric_label: "카카오 광고비",  unit: "원", format: "currency",   higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: psum("kakao_moment", "cost") },
  { metric_key: "kakao_impressions", metric_label: "카카오 노출수",  unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("kakao_moment", "impressions") },
  { metric_key: "kakao_clicks",      metric_label: "카카오 클릭수",  unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("kakao_moment", "clicks") },
  { metric_key: "kakao_conversions", metric_label: "카카오 전환수",  unit: "건", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("kakao_moment", "conversions") },
  { metric_key: "kakao_ctr",         metric_label: "카카오 CTR",     unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("kakao_moment","clicks","kakao_moment","impressions") },
  { metric_key: "kakao_cpc",         metric_label: "카카오 CPC",     unit: "원", format: "currency",   higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pratio("kakao_moment","cost","kakao_moment","clicks") },
];

// ─── Google Search Console ───────────────────────────────────────────────────
const GSC: PlatformKpiTemplate[] = [
  { metric_key: "gsc_clicks",      metric_label: "검색 클릭수",    unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("google_search_console", "clicks") },
  { metric_key: "gsc_impressions", metric_label: "검색 노출수",    unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: true,  computation: psum("google_search_console", "impressions") },
  { metric_key: "gsc_ctr",         metric_label: "검색 CTR",       unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pavg("google_search_console", "ctr") },
  { metric_key: "gsc_position",    metric_label: "평균 검색 순위", unit: "위", format: "decimal",    higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: pavg("google_search_console", "position") },
];

// ─── TikTok Ads ──────────────────────────────────────────────────────────────
const TIKTOK: PlatformKpiTemplate[] = [
  { metric_key: "tiktok_spend",       metric_label: "틱톡 광고비",   unit: "원", format: "currency",   higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: psum("tiktok_ads", "cost") },
  { metric_key: "tiktok_impressions", metric_label: "틱톡 노출수",   unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("tiktok_ads", "impressions") },
  { metric_key: "tiktok_clicks",      metric_label: "틱톡 클릭수",   unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("tiktok_ads", "clicks") },
  { metric_key: "tiktok_conversions", metric_label: "틱톡 전환수",   unit: "건", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("tiktok_ads", "conversions") },
  { metric_key: "tiktok_ctr",         metric_label: "틱톡 CTR",      unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("tiktok_ads","clicks","tiktok_ads","impressions") },
  { metric_key: "tiktok_cpc",         metric_label: "틱톡 CPC",      unit: "원", format: "currency",   higher_is_better: false, show_on_overview: false, chart_enabled: false, computation: pratio("tiktok_ads","cost","tiktok_ads","clicks") },
];

// ─── Naver GFA ───────────────────────────────────────────────────────────────
const NAVER_GFA: PlatformKpiTemplate[] = [
  { metric_key: "ngfa_spend",       metric_label: "네이버 GFA 광고비", unit: "원", format: "currency",   higher_is_better: false, show_on_overview: true,  chart_enabled: true,  computation: psum("naver_gfa", "cost") },
  { metric_key: "ngfa_impressions", metric_label: "네이버 GFA 노출수", unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("naver_gfa", "impressions") },
  { metric_key: "ngfa_clicks",      metric_label: "네이버 GFA 클릭수", unit: "회", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("naver_gfa", "clicks") },
  { metric_key: "ngfa_conversions", metric_label: "네이버 GFA 전환수", unit: "건", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("naver_gfa", "conversions") },
  { metric_key: "ngfa_ctr",         metric_label: "네이버 GFA CTR",    unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("naver_gfa","clicks","naver_gfa","impressions") },
];

// ─── Shopify ─────────────────────────────────────────────────────────────────
const SHOPIFY: PlatformKpiTemplate[] = [
  { metric_key: "shopify_revenue",   metric_label: "Shopify 매출",   unit: "원", format: "currency",   higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("shopify", "revenue") },
  { metric_key: "shopify_orders",    metric_label: "주문수",          unit: "건", format: "number",     higher_is_better: true,  show_on_overview: true,  chart_enabled: true,  computation: psum("shopify", "orders") },
  { metric_key: "shopify_aov",       metric_label: "평균 주문금액",   unit: "원", format: "currency",   higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: pratio("shopify","revenue","shopify","orders") },
  { metric_key: "shopify_sessions",  metric_label: "Shopify 세션",   unit: "회", format: "number",     higher_is_better: true,  show_on_overview: false, chart_enabled: false, computation: psum("shopify", "sessions") },
  { metric_key: "shopify_conv_rate", metric_label: "구매전환율",      unit: "%",  format: "percentage", higher_is_better: true,  show_on_overview: true,  chart_enabled: false, computation: pratio("shopify","orders","shopify","sessions") },
];

// ─── 카페24 ──────────────────────────────────────────────────────────────────
const CAFE24: PlatformKpiTemplate[] = [
  { metric_key: "cafe24_revenue",  metric_label: "카페24 매출",   unit: "원", format: "currency", higher_is_better: true, show_on_overview: true,  chart_enabled: true,  computation: psum("cafe24", "revenue") },
  { metric_key: "cafe24_orders",   metric_label: "카페24 주문수", unit: "건", format: "number",   higher_is_better: true, show_on_overview: true,  chart_enabled: true,  computation: psum("cafe24", "orders") },
  { metric_key: "cafe24_aov",      metric_label: "평균 주문금액", unit: "원", format: "currency", higher_is_better: true, show_on_overview: false, chart_enabled: false, computation: pratio("cafe24","revenue","cafe24","orders") },
  { metric_key: "cafe24_visitors", metric_label: "방문자수",      unit: "명", format: "number",   higher_is_better: true, show_on_overview: false, chart_enabled: false, computation: psum("cafe24", "visitors") },
];

// ─── 종합 (멀티플랫폼 합산) ──────────────────────────────────────────────────
const COMBINED: PlatformKpiTemplate[] = [
  {
    metric_key: "total_ad_spend", metric_label: "총 광고비", unit: "원", format: "currency", higher_is_better: false, show_on_overview: true, chart_enabled: true,
    computation: { type: "sum", sources: [
      { platform: "meta_ads", metric: "cost" }, { platform: "google_ads", metric: "cost" },
      { platform: "naver_ads", metric: "cost" }, { platform: "kakao_moment", metric: "cost" },
      { platform: "tiktok_ads", metric: "cost" }, { platform: "naver_gfa", metric: "cost" },
    ]},
  },
  {
    metric_key: "total_clicks", metric_label: "총 클릭수", unit: "회", format: "number", higher_is_better: true, show_on_overview: true, chart_enabled: true,
    computation: { type: "sum", sources: [
      { platform: "meta_ads", metric: "clicks" }, { platform: "google_ads", metric: "clicks" },
      { platform: "naver_ads", metric: "clicks" }, { platform: "kakao_moment", metric: "clicks" },
      { platform: "tiktok_ads", metric: "clicks" }, { platform: "naver_gfa", metric: "clicks" },
    ]},
  },
  {
    metric_key: "total_conversions", metric_label: "총 전환수", unit: "건", format: "number", higher_is_better: true, show_on_overview: true, chart_enabled: true,
    computation: { type: "sum", sources: [
      { platform: "meta_ads", metric: "conversions" }, { platform: "google_ads", metric: "conversions" },
      { platform: "naver_ads", metric: "conversions" }, { platform: "kakao_moment", metric: "conversions" },
      { platform: "tiktok_ads", metric: "conversions" },
    ]},
  },
  {
    metric_key: "total_impressions", metric_label: "총 노출수", unit: "회", format: "number", higher_is_better: true, show_on_overview: false, chart_enabled: false,
    computation: { type: "sum", sources: [
      { platform: "meta_ads", metric: "impressions" }, { platform: "google_ads", metric: "impressions" },
      { platform: "naver_ads", metric: "impressions" }, { platform: "kakao_moment", metric: "impressions" },
      { platform: "tiktok_ads", metric: "impressions" }, { platform: "naver_gfa", metric: "impressions" },
    ]},
  },
];

/** 플랫폼 → KPI 템플릿 매핑 */
export const PLATFORM_KPI_TEMPLATES: Record<string, PlatformKpiTemplate[]> = {
  meta_ads:              META,
  google_ads:            GADS,
  google_analytics:      GA4,
  naver_ads:             NAVER,
  naver_searchad:        NAVER,
  kakao_moment:          KAKAO,
  google_search_console: GSC,
  tiktok_ads:            TIKTOK,
  naver_gfa:             NAVER_GFA,
  shopify:               SHOPIFY,
  cafe24:                CAFE24,
  combined:              COMBINED,
};
