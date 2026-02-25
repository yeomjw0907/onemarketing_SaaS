# 구글 OAuth · API 검수 가이드

Google Cloud OAuth 동의 화면·Google Ads API 사용 시 **검증(Verification)** 및 제출 시 채울 내용을 정리한 가이드입니다. 메타 쪽은 대기 중일 때 구글 쪽을 점검·제출할 때 참고하세요.

---

## 목차

1. [전체 흐름 요약](#1-전체-흐름-요약)
2. [OAuth 동의 화면 (Google Cloud)](#2-oauth-동의-화면-google-cloud)
3. [동의 화면 검증(Verification) 제출](#3-동의-화면-검증verification-제출)
4. [Google Ads API · Developer Token](#4-google-ads-api--developer-token)
5. [검수자/테스트 계정 안내](#5-검수자테스트-계정-안내)
6. [체크리스트](#6-체크리스트)

---

## 1. 전체 흐름 요약

| 구분 | 할 일 | 참고 |
|------|--------|------|
| **OAuth 클라이언트** | Google Cloud에서 웹 앱 OAuth 클라이언트 ID/Secret 발급, 리디렉션 URI 등록 | [09-Google-OAuth-클라이언트-발급-가이드.md](./09-Google-OAuth-클라이언트-발급-가이드.md) |
| **동의 화면** | 앱 이름, scope(adwords.readonly, analytics.readonly), 테스트 사용자 또는 프로덕션 공개 | 이 문서 §2, §3 |
| **검증(Verification)** | 민감 scope 사용 시 Google 검증 요청 시 설명·정책·데모 등 제출 | 이 문서 §3 |
| **Google Ads API** | Developer Token 신청, 도구 설계 문서 등 | 이 문서 §4, [Google-Ads-API-토큰-신청-답변-정리.md](./Google-Ads-API-토큰-신청-답변-정리.md) |

---

## 2. OAuth 동의 화면 (Google Cloud)

### 2-1. 접속

- [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 선택
- **API 및 서비스** → **OAuth 동의 화면**

### 2-2. 사용자 유형

| 유형 | 설명 |
|------|------|
| **내부** | 같은 Google 조직만 사용. 검증 없이 사용 가능. |
| **외부** | 일반 사용자(클라이언트)에게 로그인 제공. **테스트** 상태에서는 테스트 사용자만 로그인 가능. **프로덕션** 공개 시 민감 scope는 **검증** 필요할 수 있음. |

원마케팅은 **외부** + 초기에는 **테스트**로 두고, 테스트 사용자에 검수용 이메일 추가해 두면 됩니다.

### 2-3. 앱 정보

| 항목 | 입력 예 |
|------|----------|
| 앱 이름 | 원마케팅 포털 (또는 Onecation) |
| 사용자 지원 이메일 | 운영자 이메일 |
| 앱 로고·앱 도메인 | (선택) 실제 서비스 URL |

### 2-4. 범위(Scopes)

우리 앱에서 사용하는 scope:

```
https://www.googleapis.com/auth/adwords.readonly
https://www.googleapis.com/auth/analytics.readonly
```

- **범위 추가 또는 삭제**에서 위 두 개 추가 후 **업데이트**.
- 이 scope들은 **제한된(민감)** 범위라, **외부 + 프로덕션**으로 공개하려면 Google 검증을 받아야 할 수 있습니다.

### 2-5. 테스트 사용자 (외부 + 테스트일 때)

- **테스트 사용자**에 검수용 또는 테스트할 Google 계정 이메일을 추가.
- 이 목록에 있는 계정만 OAuth 로그인이 가능합니다.

### 2-6. 승인된 리디렉션 URI

**사용자 인증 정보** → OAuth 2.0 클라이언트 ID 편집에서 다음을 등록:

```
http://localhost:3000/api/auth/google/callback
https://www.onemarketing.kr/api/auth/google/callback
```

실제 배포 도메인이 다르면 해당 URL로 변경. 끝에 `/` 없이 입력.

---

## 3. 동의 화면 검증(Verification) 제출

**외부** 사용자 유형으로 **프로덕션** 공개를 요청하면, 민감 scope(Google Ads, Analytics 등)에 대해 **앱 검증**을 요청받을 수 있습니다.

### 3-1. 제출 시 채울 내용 요약

- **앱 이름·홈페이지 URL**
- **앱 사용 목적·Google API 사용 방식** (아래 문단 복사·수정 가능)
- **개인정보 처리방침 URL**
- **데모 영상 또는 테스트 계정** (요구 시)

### 3-2. 앱 사용 목적·API 사용 방식 (영문, 복사용)

```
Our app "Onecation" (원마케팅) is a B2B marketing dashboard. We use the Google Ads API and Google Analytics Data API (read-only) so that our clients can connect their own Google Ads and GA4 accounts and view aggregated performance data (campaigns, impressions, clicks, spend, conversions) in a single dashboard and in reports. We do not modify campaigns or account settings. Data is used only for the account owner who connected it; we do not share or sell it. Our privacy policy and data deletion instructions are available at the URLs provided in the app settings.
```

### 3-3. 앱 사용 목적 (한국어, 참고용)

```
본 앱 "원케이션(원마케팅)"은 B2B 마케팅 대시보드입니다. Google Ads API 및 Google Analytics Data API(읽기 전용)를 사용해, 고객사가 본인의 Google Ads·GA4 계정을 연동하고 집계된 성과 데이터(캠페인, 노출, 클릭, 비용, 전환)를 대시보드와 리포트에서 확인할 수 있게 합니다. 캠페인·계정 설정 변경은 하지 않으며, 데이터는 연동한 계정 소유자만 사용하고 제3자에게 판매·공유하지 않습니다. 개인정보 처리방침 및 데이터 삭제 안내는 앱 설정에 기재된 URL에서 확인할 수 있습니다.
```

### 3-4. 검증 시 체크

- 개인정보 처리방침 URL이 실제 접근 가능한지 확인.
- 테스트 계정(이메일/비밀번호) 또는 데모 영상 요구 시 [구글-메타-심사용-데모계정-안내.md](./구글-메타-심사용-데모계정-안내.md) 참고.

---

## 4. Google Ads API · Developer Token

Google Ads API로 캠페인·지표를 조회하려면 **Developer Token**이 필요합니다.

### 4-1. 발급·신청 위치

- [Google Ads](https://ads.google.com) 로그인 → **도구 및 설정** → **설정** → **API 센터**
- 또는 Google Ads API 신청 폼(Google에서 안내하는 링크)에서 신청

### 4-2. 신청 시 채울 내용

자세한 항목별 답변은 **[Google-Ads-API-토큰-신청-답변-정리.md](./Google-Ads-API-토큰-신청-답변-정리.md)** 를 참고하세요.

| 항목 | 요약 |
|------|------|
| MCC/계정 ID | Google Ads 매니저 계정(MCC) ID 또는 광고 계정 ID (숫자만) |
| 비즈니스 모델·API 사용 방식 | B2B 마케팅 대시보드, 읽기 전용으로 캠페인·전환 데이터 조회 |
| 도구 설계 문서 | PDF/Word 1~2페이지: 도구 이름, 목적, API 사용 목적, 접근 대상, 데이터 흐름 |
| 접근 대상 | 내부+외부 (Both internal and external users) |
| 캠페인 유형 | Search, Display, Performance Max, Video 등 (조회만 함) |

### 4-3. 환경 변수

- Developer Token 발급 후 `.env.local` 또는 관리자 연동 설정에 `GOOGLE_DEVELOPER_TOKEN` 값 저장.
- 클라이언트별로 다른 토큰을 쓰는 구조가 아니면, 한 번만 설정해 두면 됩니다.

---

## 5. 검수자/테스트 계정 안내

Google 검증·OAuth 동의 화면에서 "테스트 계정" 또는 "검수자 접근 방법"을 요구할 때:

- **테스트 계정:** [구글-메타-심사용-데모계정-안내.md](./구글-메타-심사용-데모계정-안내.md) 의 데모 계정(이메일/비밀번호) 제출.
- **접근 방법:**  
  "위 URL(예: https://www.onemarketing.kr)에 접속 후 제공한 테스트 계정으로 로그인하면, 개요·실행 현황·리포트 등 대시보드를 확인할 수 있습니다. Google OAuth 연동은 관리자 메뉴 → 클라이언트 관리 → 데이터 연동 → Google OAuth 버튼으로 진행됩니다."

---

## 6. 체크리스트

### OAuth 동의 화면

| 항목 | 확인 |
|------|------|
| 프로젝트 선택 | Google Cloud에서 올바른 프로젝트 |
| 사용자 유형 | 외부 (클라이언트 연동용) |
| 앱 정보 | 앱 이름, 지원 이메일 |
| 범위 | adwords.readonly, analytics.readonly |
| 테스트 사용자 | 검수/테스트용 이메일 추가 (테스트 모드일 때) |
| 리디렉션 URI | localhost + 배포 도메인 `/api/auth/google/callback` |

### 검증(Verification) 제출 시

| 항목 | 확인 |
|------|------|
| 앱 URL | https://www.onemarketing.kr 등 |
| 사용 목적·API 사용 방식 | 위 §3-2 문단 참고 |
| 개인정보 처리방침 URL | 접근 가능한 URL |
| 테스트 계정 또는 데모 영상 | 요구 시 제출 |

### Google Ads API (Developer Token)

| 항목 | 확인 |
|------|------|
| MCC/계정 ID | 숫자만 입력 |
| 비즈니스 모델·도구 설계 문서 | Google-Ads-API-토큰-신청-답변-정리.md 참고 |
| 접근 대상·캠페인 유형 | 문서대로 선택·입력 |

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [09-Google-OAuth-클라이언트-발급-가이드.md](./09-Google-OAuth-클라이언트-발급-가이드.md) | OAuth 클라이언트 ID/Secret 발급, 리디렉션 URI |
| [Google-Ads-API-토큰-신청-답변-정리.md](./Google-Ads-API-토큰-신청-답변-정리.md) | Developer Token 신청 폼 항목별 답변 |
| [구글-메타-심사용-데모계정-안내.md](./구글-메타-심사용-데모계정-안내.md) | 심사용 데모 계정 정보 |
| [05-플랫폼-연동-셋업-가이드.md](./05-플랫폼-연동-셋업-가이드.md) | 플랫폼 연동 전체 셋업 |

이 가이드로 구글 쪽 OAuth·API 검수 단계를 점검하고, 메타 검수는 비즈니스 인증·pages_read_engagement 등 대기 중에 진행하면 됩니다.
