/**
 * 서비스 항목 카탈로그 정의
 * 관리자: 클라이언트별 on/off 토글
 * 고객 포털: 이용중/미이용 서비스 확인
 */

export interface ServiceItem {
  key: string;
  label: string;
  description: string;
  category: string;
  /** react-icons 아이콘 이름 참조용 (컴포넌트에서 매핑) */
  iconKey: string;
  /** 브랜드 컬러 (hex) */
  color: string;
}

export interface ServiceCategory {
  key: string;
  label: string;
  items: ServiceItem[];
}

export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    key: "keyword_ads",
    label: "키워드 광고",
    items: [
      {
        key: "naver_keyword_ads",
        label: "네이버 키워드 광고",
        description: "네이버 검색 결과 상단에 노출되는 키워드 기반 CPC 광고입니다. 타겟 키워드를 설정하여 잠재 고객이 검색할 때 광고를 노출합니다.",
        category: "키워드 광고",
        iconKey: "naver",
        color: "#03C75A",
      },
      {
        key: "google_search_ads",
        label: "구글 검색 광고",
        description: "Google 검색 결과에 노출되는 검색 광고입니다. Google Ads를 통해 글로벌 및 국내 사용자에게 키워드 기반 광고를 집행합니다.",
        category: "키워드 광고",
        iconKey: "google",
        color: "#4285F4",
      },
    ],
  },
  {
    key: "sns_ads",
    label: "SNS 광고",
    items: [
      {
        key: "meta_ads",
        label: "메타 광고 (Facebook/Instagram)",
        description: "Facebook과 Instagram 플랫폼에서 타겟 오디언스에게 광고를 노출합니다. 관심사, 행동, 인구통계 기반의 정밀 타겟팅이 가능합니다.",
        category: "SNS 광고",
        iconKey: "meta",
        color: "#0081FB",
      },
      {
        key: "linkedin_ads",
        label: "링크드인 광고",
        description: "B2B 마케팅에 최적화된 링크드인 광고입니다. 직무, 산업, 회사 규모 등 비즈니스 기준으로 타겟팅합니다.",
        category: "SNS 광고",
        iconKey: "linkedin",
        color: "#0A66C2",
      },
      {
        key: "tiktok_ads",
        label: "틱톡 광고",
        description: "숏폼 영상 기반의 틱톡 광고입니다. MZ세대를 중심으로 한 바이럴 마케팅과 브랜드 인지도 향상에 효과적입니다.",
        category: "SNS 광고",
        iconKey: "tiktok",
        color: "#000000",
      },
      {
        key: "daangn_ads",
        label: "당근마켓 광고",
        description: "지역 기반 당근마켓 비즈프로필 광고입니다. 동네 주민 대상의 하이퍼로컬 마케팅에 최적화되어 있습니다.",
        category: "SNS 광고",
        iconKey: "daangn",
        color: "#FF6F0F",
      },
      {
        key: "youtube_ads",
        label: "유튜브 광고",
        description: "Google Ads를 통한 유튜브 동영상 광고입니다. 인스트림, 디스커버리, 범퍼 등 다양한 형식의 영상 광고를 집행합니다.",
        category: "SNS 광고",
        iconKey: "youtube",
        color: "#FF0000",
      },
    ],
  },
  {
    key: "data_analytics",
    label: "데이터 분석",
    items: [
      {
        key: "google_analytics",
        label: "Google Analytics",
        description: "웹사이트 방문자 행동 분석 도구입니다. 트래픽 소스, 사용자 행동, 전환 데이터를 분석하여 마케팅 성과를 측정합니다.",
        category: "데이터 분석",
        iconKey: "ga",
        color: "#E37400",
      },
      {
        key: "google_tag_manager",
        label: "Google Tag Manager",
        description: "웹사이트 태그(추적 코드)를 중앙에서 관리하는 도구입니다. 전환 추적, 리마케팅 태그 등을 코드 수정 없이 관리합니다.",
        category: "데이터 분석",
        iconKey: "gtm",
        color: "#246FDB",
      },
      {
        key: "weekly_report",
        label: "주간 보고서",
        description: "매주 마케팅 성과를 분석하여 보고서를 제공합니다. 주요 KPI 변동, 캠페인 성과, 인사이트를 포함합니다.",
        category: "데이터 분석",
        iconKey: "report",
        color: "#6366F1",
      },
      {
        key: "monthly_report",
        label: "월간 보고서",
        description: "월별 종합 마케팅 성과 보고서입니다. 전월 대비 성과 분석, 전략 제안, 다음 달 액션 플랜을 포함합니다.",
        category: "데이터 분석",
        iconKey: "report",
        color: "#8B5CF6",
      },
    ],
  },
  {
    key: "promotion",
    label: "프로모션",
    items: [
      {
        key: "landing_page",
        label: "랜딩페이지",
        description: "캠페인 전용 랜딩페이지를 기획·제작합니다. 전환율 최적화(CRO)를 고려한 디자인과 A/B 테스트를 진행합니다.",
        category: "프로모션",
        iconKey: "landing",
        color: "#EC4899",
      },
      {
        key: "promo_event",
        label: "프로모션 이벤트 기획",
        description: "할인, 쿠폰, 경품 등 프로모션 이벤트를 기획하고 실행합니다. 이벤트 페이지 제작부터 마케팅까지 풀 서비스를 제공합니다.",
        category: "프로모션",
        iconKey: "promo",
        color: "#F43F5E",
      },
    ],
  },
  {
    key: "content_marketing",
    label: "콘텐츠 마케팅",
    items: [
      {
        key: "blog_content",
        label: "블로그 콘텐츠",
        description: "SEO 최적화된 블로그 콘텐츠를 제작합니다. 브랜드 전문성을 강화하고 오가닉 트래픽을 확보합니다.",
        category: "콘텐츠 마케팅",
        iconKey: "blog",
        color: "#14B8A6",
      },
      {
        key: "sns_content",
        label: "SNS 콘텐츠 제작",
        description: "인스타그램, 페이스북 등 SNS 채널용 콘텐츠(이미지, 영상, 캐러셀)를 기획·제작합니다.",
        category: "콘텐츠 마케팅",
        iconKey: "sns",
        color: "#06B6D4",
      },
    ],
  },
  {
    key: "seo",
    label: "검색엔진 최적화 (SEO)",
    items: [
      {
        key: "seo_optimization",
        label: "검색엔진 최적화",
        description: "웹사이트의 검색엔진 순위를 높이기 위한 기술적·콘텐츠 최적화를 수행합니다. 키워드 분석, 온페이지 SEO, 백링크 전략을 포함합니다.",
        category: "검색엔진 최적화 (SEO)",
        iconKey: "seo",
        color: "#22C55E",
      },
    ],
  },
  {
    key: "display_ads",
    label: "디스플레이 광고",
    items: [
      {
        key: "gdn",
        label: "GDN (Google Display Network)",
        description: "Google 디스플레이 네트워크를 통한 배너 광고입니다. 다양한 웹사이트와 앱에 시각적 광고를 노출합니다.",
        category: "디스플레이 광고",
        iconKey: "google",
        color: "#34A853",
      },
      {
        key: "naver_display",
        label: "네이버 디스플레이 광고",
        description: "네이버 메인, 뉴스, 카페 등에 노출되는 디스플레이 광고입니다. 성과형 디스플레이 광고(GFA)를 포함합니다.",
        category: "디스플레이 광고",
        iconKey: "naver",
        color: "#03C75A",
      },
    ],
  },
];

export const ALL_SERVICE_KEYS = SERVICE_CATALOG.flatMap((cat) =>
  cat.items.map((item) => item.key)
);

export function findServiceItem(key: string): ServiceItem | undefined {
  for (const cat of SERVICE_CATALOG) {
    const item = cat.items.find((i) => i.key === key);
    if (item) return item;
  }
  return undefined;
}

export function defaultEnabledServices(): Record<string, boolean> {
  return Object.fromEntries(ALL_SERVICE_KEYS.map((k) => [k, false]));
}
