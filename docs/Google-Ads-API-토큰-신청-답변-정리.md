# Google Ads API 토큰 신청 — 답변 정리

> 폼 제출 시 아래 내용을 참고해 채우세요. MCC ID·문서·접근 대상은 실제에 맞게 수정하세요.

---

## 이미 채운 항목 (확인용)

| 문항 | 답변 |
|------|------|
| 1. API 연락처 이메일이 API 센터와 일치함 | ✅ 체크 |
| 3. 연락처 이메일 | yeomj@onemarketing.co.kr |
| 4. Google 담당자와 관계 있음 | 아니오 |
| 5. 회사 대표 웹사이트 URL | onemarketing.co.kr (또는 서비스 URL: https://www.onemarketing.kr) |
| 9. 타사가 만든 도구에 토큰 사용 예정 | 아니오 |

---

## 채워야 할 항목 — 제안 답변

### 2. Developer Token에 연결된 Google Ads 매니저 계정(MCC) ID

- **형식:** 숫자만 (예: 123-456-7890 → 1234567890)
- **확인:** [Google Ads](https://ads.google.com) 로그인 → **도구 및 설정** → **설정** → 계정 ID 확인.  
  MCC를 쓰면 MCC 로그인 후 **계정**에서 상단 계정 ID 확인.
- **제안:** 본인 MCC ID를 넣으면 됨. MCC가 없으면 일반 광고 계정 ID만 있어도 되는지 신청 가이드/고객센터 확인.

---

### 6. 회사의 비즈니스 모델 및 Google Ads 사용 방식 (간단 설명)

**제안 문장 (영어로 쓸 경우):**

> We operate a marketing SaaS platform (onemarketing.kr) that provides clients with a unified dashboard for their advertising performance. We use the Google Ads API to pull campaign and conversion data for our clients, display it in reports, and support optimization decisions. Access is restricted to authenticated clients and internal staff only.

**한글 요약 (폼이 한글 허용이면 참고):**

> 원마케팅(원케이션)은 마케팅 SaaS로, 클라이언트에게 광고 성과 대시보드와 리포트를 제공합니다. Google Ads API로 캠페인·전환 데이터를 수집해 대시보드와 리포트에 표시하며, 인증된 클라이언트와 내부 담당자만 접근할 수 있습니다.

---

### 7. 도구 설계 문서 (.pdf, .doc, .rtf)

- **필수:** 신청 시 첨부 필요.
- **포함할 내용 제안:**
  - 도구 이름: 원마케팅/원케이션 클라이언트 포털 (또는 One Marketing SaaS)
  - 목적: 클라이언트 광고 성과 대시보드·리포트
  - Google Ads API 사용 목적: 캠페인·지표·전환 데이터 조회(읽기 전용)
  - 접근 주체: 관리자(내부) + 로그인한 클라이언트(외부)
  - 데이터 흐름: Google Ads API → 우리 서버 → 대시보드/리포트
  - 화면/플로우 간단 스크린샷 또는 다이어그램 있으면 추가
- **파일:** 위 내용으로 1~2페이지 분량 PDF/Word로 만들어 첨부.

---

### 8. Google Ads API 도구 접근 대상

- **선택 제안:** **Both internal and external users** (내부 직원 + 외부 클라이언트)
  - 관리자(내부)가 연동·동기화 관리, 클라이언트(외부)가 자기 대시보드/리포트 조회하는 구조라면 Both가 적합.

---

### 10. App Conversion Tracking 및 Remarketing API 사용 예정 여부

- **선택 제안:** **No**
  - 캠페인·전환 데이터 **조회/리포트**만 쓰고, App Conversion Tracking·Remarketing API를 별도로 쓰지 않으면 No.

---

### 11. 도구가 지원하는 Google Ads 캠페인 유형 *

- **입력 형식:** 쉼표로 구분 (예: Search, Performance Max, Display)
- **제안 입력 (영문):**
  ```
  Search, Display, Performance Max, Video
  ```
  - 우리 도구는 **리포트/대시보드**용이라, 클라이언트가 가진 캠페인 데이터를 **조회**만 합니다. 위는 일반적으로 많이 쓰는 캠페인 유형을 적은 것이며, API로 읽어오는 데이터에 해당 유형이 포함됩니다.

---

### 12. 도구가 제공하는 Google Ads 기능 * (복수 선택 가능)

- **제안:** **Reporting** 만 체크
  - 원마케팅은 계정/캠페인 **생성·관리**가 아니라 **성과 조회·리포트**만 제공하므로 **Reporting**만 선택하면 됩니다.
- **체크하지 않을 항목:** Account Creation, Account Management, Campaign Creation, Campaign Management, Keyword Planning Services, Other

| 옵션 | 선택 |
|------|------|
| Account Creation | ☐ |
| Account Management | ☐ |
| Campaign Creation | ☐ |
| Campaign Management | ☐ |
| **Reporting** | **☑** |
| Keyword Planning Services | ☐ |
| Other | ☐ |

---

## 제출 전 체크

- [ ] 2번 MCC ID 입력
- [ ] 6번 비즈니스 모델 설명 입력
- [ ] 7번 설계 문서 파일 첨부 (.pdf / .doc / .rtf)
- [ ] 8번 접근 대상 선택 (Both 권장)
- [ ] 10번 App Conversion / Remarketing → No 선택
- [ ] **11번 캠페인 유형** 입력 (Search, Display, Performance Max, Video)
- [ ] **12번 기능** → **Reporting** 만 체크
- [ ] 하단 두 가지 확인란 체크 후 제출

---

*env.local은 이 답변 정리와 무관하게 유지했습니다. 토큰은 폼에서 발급/승인 후 안내받은 값을 사용하세요.*
