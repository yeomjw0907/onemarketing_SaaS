# 원마케팅 SaaS — 할 일 마스터 리스트

> 마지막 업데이트: 2026-03-20
> 이 파일 하나로 전체 현황을 관리합니다.

---

## 🔴 즉시 해야 할 것 (수동 작업 — 내가 직접)

### 1. Meta 개발자 콘솔
- [ ] `https://www.onemarketing.kr/api/free-report/callback` → OAuth 리디렉션 URI에 추가
  - developers.facebook.com → 내 앱 → Facebook 로그인 → 설정
- [ ] 권한(Scopes) 4개 요청
  - `instagram_basic`
  - `instagram_manage_insights`
  - `pages_show_list`
  - `pages_read_engagement`

### 2. Supabase 보안
- [ ] Supabase 대시보드 → Authentication → Password Protection → **Leaked Password Protection 활성화**

### 3. 카카오 알림톡 템플릿 등록 (솔라피 → 카카오 비즈센터)
- [ ] `TPL_report_published` — 보고서 발행 알림
- [ ] `TPL_action_status` — 실행항목 상태 변경
- [ ] `TPL_event_reminder` — 일정 리마인더
- [ ] `TPL_mon_review` — 월요일 지난주 성과 리뷰
- [ ] `TPL_wed_budget` — 수요일 예산 페이싱
- [ ] `TPL_thu_proposal` — 목요일 다음 주 제안 + 승인
- [ ] `TPL_addon_order_admin` — 부가 서비스 주문 접수 (관리자 수신)

### 4. Vercel 환경변수 확인
- [ ] `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_PFID` 설정
- [ ] `ADMIN_NOTIFY_PHONE` 설정 (부가 서비스 주문 시 관리자 알림톡 수신 번호)
- [ ] `CRON_SECRET` 설정

---

## 🟡 개발 작업 (Claude가 진행)

### 🐛 긴급 버그 수정
- [ ] **데이터 연동 탭 오류** — `ReferenceError: Cannot access 'sn' before initialization`
  - `client-detail.tsx` 내 순환 의존성 또는 TDZ 문제

### Phase 1 — Instagram 인사이트 대시보드
> 케이스 1 (중국 구매대행), 케이스 3 (미국 로스쿨) 즉시 활용 가능

- [ ] DB 마이그레이션: `instagram_daily_stats`, `instagram_media_metrics`, `boosting_periods` 테이블
- [ ] Instagram Graph API 래퍼 확장 (`src/lib/integrations/instagram.ts`)
- [ ] API 라우트: 인사이트 fetch + DB 저장 + 부스팅 기간 CRUD
- [ ] Vercel Cron: 매일 인스타 인사이트 자동 수집
- [ ] 어드민 UI: 팔로워 추이 차트, 게시물별 성과, 부스팅 전후 비교
- [ ] 클라이언트 포털 UI: 인스타 인사이트 뷰

### Phase 2 — GA4 고도화
> 케이스 1 (중국 구매대행 랜딩페이지 분석) 핵심

- [ ] 기존 GA4 연동 코드 현황 파악
- [ ] 광고 성과 + GA4 지표 통합 뷰 (메타 ROAS ↔ 랜딩 이탈률 같이 보기)
- [ ] 어드민 리포트에 GA4 섹션 추가 (세션, 전환, 이탈률)

### Phase 3 — LinkedIn Ads 연동
> 케이스 3 (미국 로스쿨) 핵심 채널

- [ ] LinkedIn Marketing API 연동
- [ ] DB: `platform_metrics`에 `linkedin` platform 추가
- [ ] 데이터 연동 탭에 LinkedIn 선택지 추가
- [ ] 어드민 리포트에 LinkedIn 성과 섹션 추가
- [ ] Cron: LinkedIn 지표 자동 수집

---

## 🟢 장기 계획 (여유될 때)

### Meta 앱 심사
- [ ] `instagram_content_publish` 권한 심사 신청 (게시물 스케줄링용)
  - 실제 앱 시연 영상, 개인정보처리방침 페이지, 사업자 서류 필요
  - 심사 기간 1~4주

### 추가 채널 연동
- [ ] 구글 Ads 연동 고도화 (케이스 3 확장)
- [ ] 수동 지표 입력 기능 (리멤버 광고 등 API 없는 채널)

### 서비스 확장
- [ ] Instagram 게시물 스케줄링 (Meta 심사 통과 후)
- [ ] 무료 리포트(`/free-report`) Meta 앱 권한 심사 통과 후 일반 공개

---

## ✅ 완료된 것

- [x] Vercel Pro 업그레이드
- [x] Supabase Pro 사용 중
- [x] 도메인 `onemarketing.kr` 전체 적용
- [x] Supabase RLS 보안 수정 (client_portal_tokens, actions 중복 정책)
- [x] 리포트 열람 추적 (`report_views` 테이블 + 하트비트)
- [x] 광고 성과 이상 감지 (`performance_alerts` + Cron 4시간 주기)
- [x] 어드민 메인 대시보드 — 이상 감지 + 최근 열람 섹션 추가
- [x] 무료 인스타 리포트 `/free-report` (리드젠 툴)
- [x] Cron 4시간 주기 복원 (Vercel Pro)
- [x] 알림톡 cron 스케줄 (월/수/목)
- [x] GA4 기초 연동
- [x] 네이버 / Meta / Google Ads / GA4 데이터 연동 탭

---

## 📋 현재 클라이언트별 연동 현황

| 클라이언트 | 메타광고 | 인스타 관리 | GA4 | LinkedIn | 비고 |
|-----------|---------|------------|-----|---------|------|
| 중국 구매대행 | ✅ | ✅ (부스팅 포함) | 🔜 Phase2 | ❌ | 랜딩페이지 GA 분석 필요 |
| 소상공인 서비스 | ✅ | ❌ | ❌ | ❌ | 오프라인 영업팀 관리는 별도 툴 유지 |
| 미국 로스쿨 | ❌ | ✅ | ❌ | 🔜 Phase3 | LinkedIn이 주력 |
