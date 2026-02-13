# Google OAuth 클라이언트 ID / Secret 발급 가이드

> `.env.local`의 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`을 **어디서** 어떻게 발급하는지 정리한 문서입니다.  
> Google Ads·GA4 연동 시 동일한 OAuth 클라이언트를 사용합니다.

---

## 1. 발급 위치

| 항목 | 값 |
|------|-----|
| **사이트** | [Google Cloud Console](https://console.cloud.google.com) |
| **필요한 것** | Google 계정, 프로젝트 1개, OAuth 2.0 클라이언트(웹 앱) 1개 |

---

## 2. 단계별 발급 방법

### 2-1. Google Cloud 프로젝트 만들기

1. [Google Cloud Console](https://console.cloud.google.com) 접속 후 로그인
2. 상단 **프로젝트 선택** 드롭다운 클릭
3. **"새 프로젝트"** 클릭
4. **프로젝트 이름** 입력 (예: `원마케팅SaaS`) → **만들기**
5. 만들어진 프로젝트를 선택해 해당 프로젝트로 전환

---

### 2-2. OAuth 동의 화면 설정

OAuth 클라이언트를 쓰려면 먼저 "동의 화면"을 설정해야 합니다.

1. 왼쪽 메뉴: **API 및 서비스** → **OAuth 동의 화면**
2. **사용자 유형**
   - 테스트만 할 때: **내부** (동일 조직만)
   - 외부 사용자(클라이언트) 연동: **외부** 선택 후 **만들기**
3. **앱 정보** 입력
   - 앱 이름: 예) `원마케팅 포털`
   - 사용자 지원 이메일: 본인 이메일
   - (선택) 앱 로고, 도메인
4. **범위(Scopes)** → **범위 추가 또는 삭제**
   - 아래 scope 추가 후 **업데이트**:
     - `https://www.googleapis.com/auth/adwords.readonly` (Google Ads)
     - `https://www.googleapis.com/auth/analytics.readonly` (GA4)
5. **테스트 사용자** (외부 선택 시): 테스트할 Google 계정 이메일 추가
6. **저장 후 계속** → **대시보드로 돌아가기**

---

### 2-3. OAuth 2.0 클라이언트 ID 생성

1. 왼쪽 메뉴: **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. **애플리케이션 유형**: **웹 애플리케이션**
4. **이름**: 예) `원마케팅 포털 웹`
5. **승인된 JavaScript 원본** (필수는 아님, 필요 시 추가)
   - 로컬: `http://localhost:3000`
   - 배포: `https://www.onemarketing.kr` (실제 도메인으로 변경)
6. **승인된 리디렉션 URI** — **반드시 아래 두 개 추가**
   ```
   http://localhost:3000/api/auth/google/callback
   https://www.onemarketing.kr/api/auth/google/callback
   ```
   > 실제 배포 도메인이 다르면 해당 URL로 넣습니다. 끝에 슬래시(`/`) 없이 입력.
7. **만들기** 클릭

---

### 2-4. Client ID / Client Secret 복사

생성이 끝나면 팝업에 다음이 표시됩니다.

| 화면에 보이는 이름 | `.env.local` 변수명 | 설명 |
|--------------------|----------------------|------|
| **클라이언트 ID**   | `GOOGLE_CLIENT_ID`   | `xxxxx.apps.googleusercontent.com` 형태 |
| **클라이언트 보안 비밀** | `GOOGLE_CLIENT_SECRET` | 영문/숫자 조합 문자열 |

1. **클라이언트 ID** 전체 복사 → `.env.local`의 `GOOGLE_CLIENT_ID=` 뒤에 붙여넣기
2. **클라이언트 보안 비밀** 복사 → `.env.local`의 `GOOGLE_CLIENT_SECRET=` 뒤에 붙여넣기

**예시 (값은 실제로 발급받은 값으로 채우기):**
```bash
GOOGLE_CLIENT_ID=123456789012-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. `.env.local`에 넣는 위치

프로젝트 루트의 `.env.local` 파일에서 아래 두 줄에 값을 채웁니다.

```bash
# ── Google Ads + GA4 ──
GOOGLE_CLIENT_ID=여기에_클라이언트_ID_붙여넣기
GOOGLE_CLIENT_SECRET=여기에_클라이언트_시크릿_붙여넣기
```

- 따옴표 없이 그대로 붙여넣으면 됩니다.
- 저장 후 개발 서버를 다시 실행해야 반영됩니다.

---

## 4. 추가로 필요한 것 (Google Ads / GA4 연동 시)

- **Google Ads만 쓸 때**
  - [Google Ads API](https://console.cloud.google.com/apis/library)에서 **Google Ads API** 사용 설정
  - [Google Ads](https://ads.google.com) → 도구 및 설정 → API 센터에서 **Developer Token** 발급
- **GA4만 쓸 때**
  - **Google Analytics Data API**, **Google Analytics Admin API** 사용 설정
- **Ads + GA4 둘 다**
  - 위 API 모두 사용 설정 + 동의 화면 scope에 `adwords.readonly`, `analytics.readonly` 모두 추가

자세한 연동 절차는 [05-플랫폼-연동-셋업-가이드.md](./05-플랫폼-연동-셋업-가이드.md)의 "3-3. Google Ads", "3-4. Google Analytics (GA4)"를 참고하세요.

---

## 5. 요약

| 단계 | 할 일 |
|------|--------|
| 1 | [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 생성 |
| 2 | **API 및 서비스** → **OAuth 동의 화면** 설정 (앱 이름, scope) |
| 3 | **API 및 서비스** → **사용자 인증 정보** → **OAuth 클라이언트 ID** 생성 (웹 앱) |
| 4 | 리디렉션 URI에 `.../api/auth/google/callback` (로컬 + 배포) 추가 |
| 5 | 발급된 **클라이언트 ID** → `GOOGLE_CLIENT_ID`, **클라이언트 보안 비밀** → `GOOGLE_CLIENT_SECRET`을 `.env.local`에 입력 |

이후 관리자 페이지에서 클라이언트 상세 → 데이터 연동 → **Google OAuth** 버튼으로 로그인해 연동하면 됩니다.
