/**
 * 부가 서비스 카탈로그 (Add-on Store)
 * 카테고리별 서비스 키/라벨/설명/가격 정의
 */

export interface AddonItem {
  key: string;
  label: string;
  description: string;
  priceWon: number;
  priceNote: string;
}

export interface AddonCategory {
  categoryKey: string;
  categoryLabel: string;
  items: AddonItem[];
}

export const ADDON_CATALOG: AddonCategory[] = [
  {
    categoryKey: "page_site",
    categoryLabel: "페이지·사이트",
    items: [
      { key: "detail_page_edit", label: "상세페이지 부분 수정", description: "상품/서비스 상세 일부 문구·이미지 수정", priceWon: 50000, priceNote: "건당" },
      { key: "landing_one", label: "랜딩페이지 1페이지 제작", description: "단일 목표(문의/가입 등) 전용 LP", priceWon: 300000, priceNote: "1페이지" },
      { key: "main_banner", label: "메인 비주얼 배너 교체", description: "메인 상단 배너 1종 디자인·적용", priceWon: 80000, priceNote: "1종" },
    ],
  },
  {
    categoryKey: "content",
    categoryLabel: "콘텐츠",
    items: [
      { key: "seo_blog_one", label: "SEO 블로그 포스팅 1회", description: "키워드 반영 블로그 1편 작성·발행", priceWon: 30000, priceNote: "1회" },
      { key: "seo_blog_three", label: "블로그 포스팅 3회 패키지", description: "SEO 블로그 3편 (키워드 분배)", priceWon: 80000, priceNote: "3회" },
      { key: "receipt_review_one", label: "영수증 리뷰 작성", description: "구매 확정 고객 대상 리뷰 유도·작성 지원", priceWon: 15000, priceNote: "건당" },
      { key: "receipt_review_ten", label: "영수증 리뷰 10건 패키지", description: "리뷰 10건 일괄 진행", priceWon: 120000, priceNote: "10건" },
    ],
  },
  {
    categoryKey: "design",
    categoryLabel: "디자인",
    items: [
      { key: "event_banner", label: "이벤트 배너 추가 제작", description: "이벤트용 배너 1종 (SNS/웹)", priceWon: 20000, priceNote: "1종" },
      { key: "sns_feed_one", label: "SNS 피드 이미지 1종", description: "인스타/페이스북용 피드 1장", priceWon: 25000, priceNote: "1종" },
      { key: "thumbnail_cover", label: "썸네일/커버 이미지 제작", description: "유튜브/강의 썸네일 1종", priceWon: 40000, priceNote: "1종" },
    ],
  },
  {
    categoryKey: "video",
    categoryLabel: "영상",
    items: [
      { key: "reels_edit", label: "릴스/숏폼 편집 1편", description: "15~60초 숏폼 편집 (자료 제공 시)", priceWon: 150000, priceNote: "1편" },
      { key: "youtube_edit_10min", label: "유튜브 영상 편집 (10분 기준)", description: "컷편집·자막·간단 효과", priceWon: 200000, priceNote: "10분 기준" },
      { key: "subtitle_10min", label: "영상 자막 삽입 (10분 기준)", description: "기존 영상 자막 제작·삽입", priceWon: 80000, priceNote: "10분 기준" },
    ],
  },
  {
    categoryKey: "sns_follower",
    categoryLabel: "SNS·팔로워",
    items: [
      { key: "follower_small", label: "팔로워 작업 (소규모)", description: "계정 성장용 팔로워·참여 작업 (1회)", priceWon: 50000, priceNote: "1회" },
      { key: "follower_monthly", label: "팔로워 작업 (중규모)", description: "월 단위 관리형 팔로워 작업", priceWon: 150000, priceNote: "월" },
      { key: "influencer_one", label: "인플루언서 1회 협찬", description: "소규모 인플루언서 1회 협찬 매칭·진행", priceWon: 200000, priceNote: "1회~" },
    ],
  },
  {
    categoryKey: "seo_backlink",
    categoryLabel: "SEO·백링크",
    items: [
      { key: "backlink_one", label: "백링크 작업 1건", description: "신뢰 사이트 1곳 백링크 배치", priceWon: 80000, priceNote: "1건" },
      { key: "backlink_five", label: "백링크 5건 패키지", description: "백링크 5곳 패키지", priceWon: 350000, priceNote: "5건" },
      { key: "keyword_rank_report", label: "키워드 순위 리포트 1회", description: "타겟 키워드 순위·경쟁 분석", priceWon: 50000, priceNote: "1회" },
    ],
  },
  {
    categoryKey: "ad_performance",
    categoryLabel: "광고·퍼포먼스",
    items: [
      { key: "ad_ab_test", label: "광고 소재 A/B 테스트 세트", description: "소재 2종 제작·배치·성과 정리", priceWon: 100000, priceNote: "세트" },
      { key: "pixel_check", label: "전환 픽셀/태그 점검", description: "GA4·광고 픽셀·이벤트 점검·보고", priceWon: 60000, priceNote: "1회" },
    ],
  },
  {
    categoryKey: "other",
    categoryLabel: "기타",
    items: [
      { key: "competitor_research", label: "경쟁사/시장 리서치 1회", description: "간단 경쟁사·시장 현황 정리", priceWon: 80000, priceNote: "1회" },
      { key: "kakao_channel_setup", label: "카카오톡 채널 프로필/메뉴 구성", description: "채널 소개·메뉴 구조 설계·안 작성", priceWon: 40000, priceNote: "1회" },
      { key: "gmb_optimize", label: "구글 마이비즈니스 최적화", description: "프로필·사진·카테고리·소개 최적화", priceWon: 50000, priceNote: "1회" },
    ],
  },
];

/** 모든 부가 서비스 아이템 flat 배열 */
export const ADDON_ITEMS_FLAT = ADDON_CATALOG.flatMap((cat) =>
  cat.items.map((item) => ({ ...item, categoryKey: cat.categoryKey, categoryLabel: cat.categoryLabel }))
);

export function getAddonItemByKey(key: string): AddonItem | undefined {
  for (const cat of ADDON_CATALOG) {
    const item = cat.items.find((i) => i.key === key);
    if (item) return item;
  }
  return undefined;
}
