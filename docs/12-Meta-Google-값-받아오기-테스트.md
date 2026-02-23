# Meta·Google에서 값 받아오기 테스트 가이드

> Meta(페이스북/인스타 광고)와 Google(Ads·GA4) 연동 후 **실제로 데이터가 들어오는지** 확인하는 순서입니다.

---

## 공통 사전 확인

- [ ] `npm run dev` 실행 중, 관리자로 로그인 가능
- [ ] `.env.local`에 아래 값 설정됨  
  - **Meta:** `META_APP_ID`, `META_APP_SECRET`  
  - **Google:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`  
  - **앱 URL:** `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] 테스트할 **클라이언트** 선택 (예: 성신컴퍼니)  
  → 관리자 → **클라이언트** → 해당 클라이언트 클릭 → **데이터 연동** 탭

---

## 1. Meta (페이스북/인스타 광고) 테스트

### 1-1. OAuth 연동 (한 번만)

1. **데이터 연동** 탭에서 **Meta OAuth** 버튼 클릭
2. App ID 입력 창이 뜨면 `.env.local`의 `META_APP_ID` 입력
3. Facebook **다시 연결** 화면에서 **다시 연결** 클릭
4. 돌아온 뒤 **광고 계정 ID** 입력  
   - 형식: `act_숫자`  
   - 확인: [Meta 비즈니스 설정](https://business.facebook.com/settings) → 광고 계정 → 광고 계정 ID
5. **연동 저장** 클릭

### 1-2. 값 받아오기 테스트

1. 데이터 연동 목록에 **Meta Ads** 항목이 보이면 **🔄 수동 동기화** 버튼 클릭
2. 동기화가 끝날 때까지 대기 (몇 초~수십 초)
3. **확인 방법**
   - 같은 화면에서 **동기화 로그** 또는 **최근 동기화** 상태 확인
   - 또는 Supabase **Table Editor** → `platform_metrics` 테이블에서 해당 `client_id`·`platform = 'meta_ads'` 로 데이터 확인

### 1-3. 안 될 때

| 현상 | 확인 |
|------|------|
| Facebook으로 안 넘어감 | URL이 `http://localhost:3000`인지, App ID가 `.env.local`과 같은지 |
| 연동 저장 실패 | 광고 계정 ID가 `act_숫자` 형식인지 |
| 동기화 실패 | Meta 앱 권한에 `ads_read` 등 포함됐는지, 해당 광고 계정이 로그인한 Facebook 계정 소유인지 |

자세한 순서: **`10-Meta-OAuth-이어하기.md`**

---

## 2. Google (Ads·GA4) 테스트

### 2-1. 사전 준비 (Google Cloud)

- [ ] [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 1개 생성
- [ ] **OAuth Consent Screen** 설정 (External), Scopes 추가  
  - `https://www.googleapis.com/auth/adwords.readonly` (Ads)  
  - `https://www.googleapis.com/auth/analytics.readonly` (GA4)
- [ ] **OAuth 2.0 클라이언트 ID** (웹 앱) 생성  
  - 리디렉션 URI: `http://localhost:3000/api/auth/google/callback`
- [ ] **Google Ads API** / **Google Analytics Data API** 사용 설정
- [ ] (Ads만) [Google Ads](https://ads.google.com) → API 센터에서 **Developer Token** 발급

자세한 단계: **`09-Google-OAuth-클라이언트-발급-가이드.md`**, **`05-플랫폼-연동-셋업-가이드.md`** 3-3·3-4절

### 2-2. OAuth 연동 (한 번만)

1. **데이터 연동** 탭에서 **Google OAuth** 버튼 클릭 (UI에 있다면)
2. Google 로그인·동의 후 돌아오면:
   - **Google Ads:** Refresh Token(또는 앱에서 자동 저장), **Customer ID**(숫자만), **Developer Token** 입력 후 저장
   - **GA4:** **Property ID** (`properties/숫자` 형식) 입력 후 저장
3. **연동 저장** 클릭

### 2-3. 연결 테스트 (값 받기 전 검증)

- UI에 **연결 테스트** 버튼이 있으면 클릭 → "연결 성공" 확인
- 또는 API로 직접 테스트:
  - `POST /api/admin/integrations/test`  
  - Body: `{ "platform": "google_ads", "credentials": { ... } }` 또는 `"google_analytics"` + GA4 credentials

### 2-4. 값 받아오기 테스트

1. 데이터 연동 목록에 **Google Ads** 또는 **Google Analytics** 항목이 보이면 **🔄 수동 동기화** 클릭
2. 동기화 완료 후 **platform_metrics** 또는 동기화 로그에서 해당 `client_id`·`platform` 데이터 확인

### 2-5. 안 될 때

| 현상 | 확인 |
|------|------|
| OAuth 후 에러 | 리디렉션 URI가 `http://localhost:3000/api/auth/google/callback` 로 등록됐는지 |
| "연결 실패" | OAuth Consent Screen·Scope, API 사용 설정 |
| 동기화 실패 | Customer ID / Property ID 형식, Developer Token(Ads) |

---

## 3. 결과 확인 (공통)

- **앱 UI:** 관리자 → 클라이언트 → 데이터 연동 → 동기화 로그 / 최근 동기화 시간
- **DB:** Supabase → Table Editor  
  - `integration_sync_logs`: 동기화 시도·성공/실패  
  - `platform_metrics`: 수집된 지표 (client_id, platform, metric_date, metric_key, metric_value)

---

## 4. 요약 체크리스트

| 단계 | Meta | Google (Ads/GA4) |
|------|------|------------------|
| 1. env 설정 | META_APP_ID, META_APP_SECRET | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| 2. OAuth 앱 설정 | Meta 앱·리디렉션 URI | Google Cloud OAuth·리디렉션 URI |
| 3. 관리자에서 연동 | Meta OAuth → 광고 계정 ID 저장 | Google OAuth → CID/Property ID 등 저장 |
| 4. 값 테스트 | 수동 동기화 → platform_metrics 확인 | 수동 동기화 → platform_metrics 확인 |

---

---

## 5. 배포 시 (프로덕션 — https://www.onemarketing.kr)

로컬(`localhost:3000`)만이 아니라 **실서비스 도메인**도 등록해야 OAuth가 프로덕션에서 동작합니다.  
배포 도메인: **`https://www.onemarketing.kr`** (끝에 슬래시 없음)

| 항목 | 로컬 (개발) | 프로덕션 (배포) |
|------|-------------|-----------------|
| **앱 URL** | `NEXT_PUBLIC_APP_URL=http://localhost:3000` | `NEXT_PUBLIC_APP_URL=https://www.onemarketing.kr` (Vercel 환경 변수에 설정) |
| **Meta 리디렉션 URI** | `http://localhost:3000/api/auth/meta/callback` | `https://www.onemarketing.kr/api/auth/meta/callback` → [Meta for Developers](https://developers.facebook.com) 앱 설정에 **추가** |
| **Google 리디렉션 URI** | `http://localhost:3000/api/auth/google/callback` | `https://www.onemarketing.kr/api/auth/google/callback` → [Google Cloud Console](https://console.cloud.google.com) OAuth 클라이언트 **승인된 리디렉션 URI**에 **추가** |

**요약:**  
- **환경 변수:** Vercel에서 `NEXT_PUBLIC_APP_URL=https://www.onemarketing.kr` 설정.  
- **Meta·Google:** 각 OAuth 앱에 **프로덕션 리디렉션 URI**를 **추가**로 등록 (localhost는 그대로 두고 새 URI만 추가하면 됨).

---

*상세 셋업은 `05-플랫폼-연동-셋업-가이드.md`, Meta만은 `10-Meta-OAuth-이어하기.md`, Google OAuth는 `09-Google-OAuth-클라이언트-발급-가이드.md` 참고.*
