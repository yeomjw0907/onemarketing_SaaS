# 메타 Ads Management Standard Access 검수 요청 작성 가이드

Meta 앱 검수에서 **Ads Management Standard Access** 기능을 요청할 때, "요청된 권한을 앱에서 사용하는 방식" 상세 설명란에 넣을 문구와 화면 녹화·체크박스 안내입니다.

---

## 1. 상세 설명란에 넣을 내용 (복사해서 사용)

아래 문단을 **그대로 또는 서비스명만 수정**해서 "자세한 설명을 제공하세요" 입력란에 붙여넣으면 됩니다.

---

**영문 (권장 — Meta 검수팀이 영문으로 보는 경우가 많음):**

```
Our app "Onecation" (원마케팅) is a B2B marketing dashboard and reporting platform for businesses. We use Ads Management Standard Access (Marketing API with ads_read / ads_management) for the following purposes only:

1) How we use the permission:
   - Users (our clients) connect their own Meta/Facebook ad account via Facebook Login (OAuth). After authorization, they enter their Ad Account ID (e.g. act_123456789) in our portal.
   - We use the Marketing API to read aggregated ad performance data (impressions, clicks, spend, conversions) for that linked ad account only. Data is displayed in the client's private dashboard and in reports we generate for them.
   - We do not run ads, create campaigns, or modify any ad account settings. We only read performance metrics that the user has already authorized us to access.

2) Value to users:
   - Clients can view their Meta/Facebook ad performance (cost, reach, conversions) in one place alongside other marketing channels (e.g. Google, Naver) and use it for internal reporting and decision-making.

3) Why this permission is necessary:
   - Without Ads Management Standard Access, we cannot retrieve ad account metrics via the Marketing API. Reading these metrics is essential to provide the core service: a unified marketing performance dashboard and reports for our paying clients.

All data is used solely for the account owner who connected it; we do not share or sell it to third parties. Our Privacy Policy and Data Deletion instructions are available at the URLs we provided in the app's Basic Settings.
```

---

**한국어 (보조용 — 필요 시 사용):**

```
본 앱 "원케이션(Onecation)"은 B2B 마케팅 대시보드·리포트 서비스입니다. Ads Management Standard Access(ads_read, ads_management) 권한은 아래 목적으로만 사용합니다.

1) 권한 사용 방식:
   - 이용자(우리 고객사)가 Facebook 로그인(OAuth)으로 본인의 Meta/Facebook 광고 계정을 연동합니다. 인증 후 포털에서 해당 광고 계정 ID(예: act_123456789)를 입력합니다.
   - Marketing API를 통해 연동된 광고 계정의 집계된 성과 데이터(노출, 클릭, 비용, 전환 등)만 조회합니다. 해당 데이터는 해당 클라이언트 전용 대시보드와 리포트에만 표시됩니다.
   - 광고 집행·캠페인 생성·계정 설정 변경은 하지 않으며, 이용자가 연동을 허락한 계정의 성과 지표 조회만 수행합니다.

2) 이용자에게 제공하는 가치:
   - 고객사가 Meta/Facebook 광고 비용·도달·전환 등 성과를 한곳에서 확인하고, 다른 채널(Google, 네이버 등)과 함께 내부 리포트 및 의사결정에 활용할 수 있습니다.

3) 해당 권한이 필요한 이유:
   - Ads Management Standard Access 없이는 Marketing API로 광고 계정 지표를 조회할 수 없습니다. 이 조회 기능이 서비스의 핵심인 "통합 마케팅 성과 대시보드 및 리포트" 제공에 필수입니다.

모든 데이터는 연동한 계정 소유자만 사용하며, 제3자에게 판매·공유하지 않습니다. 개인정보 처리방침 및 데이터 삭제 안내 URL은 앱 기본 설정에 기재한 주소에서 확인할 수 있습니다.
```

---

## 2. 화면 녹화에서 보여줄 내용

Meta 가이드에 맞춰 **앱이 해당 권한을 실제로 사용하는 흐름**을 보여주면 됩니다.

1. **로그인**  
   - 관리자 또는 클라이언트로 로그인 (테스트 계정 가능).

2. **Meta 연동**  
   - 데이터 연동(또는 설정) 메뉴로 이동 → **Meta OAuth**(또는 Facebook 연결) 버튼 클릭 → Facebook 인증 화면 → 권한 동의 후 앱으로 복귀.

3. **광고 계정 연결**  
   - 돌아온 뒤 **광고 계정 ID** 입력란에 `act_숫자` 형식 입력 → 저장/연동 완료.

4. **데이터 사용 화면**  
   - 대시보드 또는 리포트 화면에서 **Meta 광고 성과**(노출, 클릭, 비용 등)가 표시되는 화면을 짧게 보여주기.

5. **녹화 길이**  
   - 1~3분 내외로, 위 단계가 끊기지 않고 보이면 됩니다.  
   - 가능하면 **화면 녹화 가이드**에서 요구하는 형식(해상도, 음성/자막 등)을 확인 후 맞추세요.

---

## 3. 동의 체크박스

- **"승인되면 Ads Management Standard Access을(를) 통해 수신하는 모든 데이터를 허용되는 사용 방법에 따라 사용할 것이라는 데 동의합니다."**
- 이 문구에 **체크**한 뒤 **저장**해야 검수 요청이 완료됩니다.

---

## 4. 요약 체크리스트

| 항목 | 확인 |
|------|------|
| 상세 설명란 | 위 영문(또는 한국어) 문단 붙여넣기 |
| 화면 녹화 | Meta OAuth → 광고 계정 ID 입력 → 대시보드/리포트에 성과 표시되는 흐름 녹화 후 업로드 |
| 동의 체크박스 | 체크 후 저장 |

이렇게 작성하면 Ads Management Standard Access 검수 요청을 제출할 수 있습니다.

---

# pages_show_list 권한 요청 (별도 폼용)

Meta에서 **pages_show_list** 권한 요청 시 나오는 "요청된 권한 또는 기능을 앱에서 사용하는 방식..." 폼에 넣을 내용입니다.

---

## 1. 상세 설명란에 넣을 내용 (복사해서 사용)

**영문 (권장):**

```
Our app "Onecation" (원마케팅) is a B2B marketing dashboard. We request pages_show_list for the following use only:

1) How we use this permission:
   - When users connect their Meta/Facebook account via Facebook Login (OAuth), we use pages_show_list to access the list of Facebook Pages they manage. We display this list so the user can confirm their identity and choose which page (and associated ad account) to link to our dashboard for ad performance reporting.
   - We do not use this data for advertising, re-identification, or any purpose other than showing the user their own managed pages during the connection flow.

2) Value to users:
   - Users can see which pages they manage in one place and clearly select the correct page/ad account to connect. This reduces errors and makes the Meta ad account linking process transparent and controllable.

3) Why this permission is necessary:
   - Without pages_show_list we cannot retrieve the list of pages the user manages. Showing this list is necessary so users can verify and select the right asset to link before entering their Ad Account ID for our Marketing API integration. It is required for a clear, policy-compliant connection experience.

All data is used only for the account owner who connected it; we do not share or sell it. Privacy Policy and Data Deletion instructions are available in the app's Basic Settings.
```

**한국어 (보조용):**

```
본 앱 "원케이션(원마케팅)"은 B2B 마케팅 대시보드 서비스입니다. pages_show_list 권한은 아래와 같이만 사용합니다.

1) 권한 사용 방식:
   - 이용자가 Facebook 로그인(OAuth)으로 Meta/Facebook 계정을 연동할 때, 이용자가 관리하는 Facebook 페이지 목록을 조회하기 위해 사용합니다. 연동 흐름에서 이 목록을 보여 주어, 이용자가 본인임을 확인하고 어떤 페이지(및 해당 광고 계정)를 우리 대시보드와 연결할지 선택할 수 있게 합니다.
   - 이 데이터를 광고 타겟팅·재식별 등 다른 목적으로 사용하지 않습니다.

2) 이용자에게 제공하는 가치:
   - 이용자가 관리하는 페이지를 한곳에서 확인하고, 연동할 페이지/광고 계정을 명확히 선택할 수 있어 오류를 줄이고, Meta 광고 계정 연동 과정이 투명하게 진행됩니다.

3) 해당 권한이 필요한 이유:
   - pages_show_list 없이는 이용자가 관리하는 페이지 목록을 가져올 수 없습니다. 연동 시 이 목록을 보여 주는 것은, 이용자가 Marketing API 연동을 위해 광고 계정 ID를 입력하기 전에 올바른 자산을 확인·선택할 수 있게 하기 위해 필요하며, 정책에 맞는 연동 경험을 위해 필수입니다.

모든 데이터는 연동한 계정 소유자만 사용하며 제3자에게 판매·공유하지 않습니다. 개인정보 처리방침 및 데이터 삭제 안내는 앱 기본 설정의 URL에서 확인할 수 있습니다.
```

---

## 2. 화면 녹화에서 보여줄 내용 (pages_show_list)

1. **관리자(또는 클라이언트) 로그인** 후 데이터 연동(또는 설정) 메뉴로 이동.
2. **Meta OAuth(또는 Facebook 연결)** 버튼 클릭 → Facebook 인증 화면으로 이동.
3. **권한 동의** 후 앱으로 복귀하는 과정을 보여주기 (가능하면 연동 후 “관리하는 페이지” 목록이 노출되는 화면이 있으면 그 부분 포함).
4. **광고 계정 ID 입력** → 연동 저장 → 대시보드에서 Meta 성과가 보이는 화면을 짧게 노출.
5. **1~3분 내외**, 끊기지 않게 한 흐름으로 녹화. Meta 화면 녹화 가이드(해상도·형식)를 확인해 맞추면 좋습니다.

---

## 3. 동의 체크박스

- **"승인되면 pages_show_list을(를) 통해 수신하는 모든 데이터를 허용되는 사용 방법에 따라 사용할 것이라는 데 동의합니다."** 에 체크.
- **저장** 버튼 클릭해 제출.

---

## 4. pages_show_list 제출 체크리스트

| 항목 | 확인 |
|------|------|
| 상세 설명란 | 위 영문(또는 한국어) 문단 붙여넣기 |
| 화면 녹화 | Meta OAuth → (페이지 목록 확인) → 광고 계정 ID 입력 → 대시보드 성과 표시 흐름 업로드 |
| 동의 체크박스 | 체크 후 저장 |

---

# ads_read 권한 요청 (별도 폼용)

Meta에서 **"ads_read 기능을 요청하는 이유를 알려주세요"** 폼에 넣을 내용입니다.

---

## 1. 사용 방법 선택 (체크박스)

**첫 번째 항목만 체크:**

- ✅ **"맞춤 대시보드와 데이터 분석에 사용할 수 있도록 광고 성과 데이터에 대한 액세스 권한을 API에 제공합니다."**  
  (Provide API access to ad performance data for use in custom dashboards and data analysis.)

→ 우리 서비스는 연동한 광고 계정의 성과 데이터를 조회해 대시보드·리포트에 쓰므로 이 선택지가 정확히 해당합니다.  
"서버에서 Facebook으로 웹 이벤트 전송", "기타"는 체크하지 않습니다.

---

## 2. 추가 상세 설명 (선택, 텍스트 칸에 넣을 때)

필요하면 아래 문단을 **그대로 또는 서비스명만 수정**해서 "추가 상세 정보" 입력란에 붙여넣으세요.

**영문:**

```
Our app "Onecation" (원마케팅) is a B2B marketing dashboard. Users (our clients) connect their own Meta ad account via Facebook Login. We use ads_read only to read aggregated ad performance (impressions, clicks, spend, conversions) for that linked account and display it in the client's private dashboard and reports. We do not run ads or modify ad settings. Data is used solely for the account owner; we do not share or sell it. Privacy Policy and Data Deletion URLs are in the app Basic Settings.
```

**한국어:**

```
본 앱 "원케이션(원마케팅)"은 B2B 마케팅 대시보드입니다. 이용자(고객사)가 Facebook 로그인으로 본인 Meta 광고 계정을 연동하고, ads_read는 연동된 계정의 집계된 광고 성과(노출·클릭·비용·전환)만 조회해 해당 클라이언트 전용 대시보드와 리포트에 표시하는 데만 사용합니다. 광고 집행·계정 설정 변경은 하지 않으며, 데이터는 연동한 계정 소유자만 사용하고 제3자에게 판매·공유하지 않습니다. 개인정보처리방침·데이터 삭제 안내는 앱 기본 설정에 기재되어 있습니다.
```

---

## 3. 화면 녹화

- **데이터 연동** → **Meta OAuth** 클릭 → Facebook 인증 → 앱 복귀 → **광고 계정 ID 입력** → 저장 → **대시보드/리포트에서 Meta 성과(노출·클릭·비용 등) 표시**되는 흐름을 1~3분 내외로 녹화 후 업로드.
- Meta 화면 녹화 가이드(해상도·형식)에 맞추면 좋습니다.

---

## 4. API 테스트 호출

- 폼에 **"ads_read 완료됨"** 이 이미 표시되어 있으면 별도 조치 없음.
- 표시되지 않으면 Meta 개발자 콘솔에서 **테스트(Test)** 로 이동해 ads_read 관련 필수 API 테스트 호출을 완료한 뒤, 최대 24시간 후 다시 확인.

---

## 5. 동의 체크박스

- **"승인되면 ads_read을(를) 통해 수신하는 모든 데이터를 허용되는 사용 방법에 따라 사용할 것이라는 데 동의합니다."** 에 **체크**.

---

## 6. 저장

- **저장** 버튼 클릭해 제출.

---

## 7. ads_read 제출 체크리스트

| 항목 | 확인 |
|------|------|
| 사용 방법 | "맞춤 대시보드와 데이터 분석에 사용..." 첫 번째 체크박스만 선택 |
| 추가 설명 | (선택) 위 영문/한국어 문단 붙여넣기 |
| 화면 녹화 | Meta OAuth → 광고 계정 ID 입력 → 대시보드 성과 표시 업로드 |
| API 테스트 | ads_read 완료됨 표시 확인 |
| 동의 체크박스 | 체크 후 저장 |

---

# ads_management 권한 요청 (별도 폼용)

Meta에서 **"ads_management 기능을 요청하는 이유를 알려주세요"** 폼에 넣을 내용입니다.

---

## 1. 상세 설명란에 넣을 내용 (복사해서 사용)

**영문 (권장):**

```
Our app "Onecation" (원마케팅) is a B2B marketing dashboard. We request ads_management for the following use only:

1) How we use this permission:
   - Users (our clients) connect their own Meta/Facebook ad account via Facebook Login. We use ads_management to access the Marketing API to read ad account information and aggregated performance data (impressions, clicks, spend, conversions) for that linked account only. Data is displayed in the client's private dashboard and reports.
   - We do not create or edit campaigns, ad sets, or ads. We do not run ads or change ad account settings. We only read metrics that the user has authorized us to access, for reporting purposes.

2) Value to users:
   - Clients can view their Meta/Facebook ad performance in one place alongside other channels (e.g. Google, Naver) and use it for internal reporting and decision-making.

3) Why this permission is necessary:
   - ads_management is required by the Marketing API to read ad account and campaign-level metrics. Without it we cannot retrieve the performance data needed for our core service: a unified marketing dashboard and reports for our paying clients.

All data is used solely for the account owner who connected it; we do not share or sell it. Privacy Policy and Data Deletion instructions are in the app Basic Settings.
```

**한국어 (보조용):**

```
본 앱 "원케이션(원마케팅)"은 B2B 마케팅 대시보드입니다. ads_management 권한은 아래와 같이만 사용합니다.

1) 권한 사용 방식:
   - 이용자(고객사)가 Facebook 로그인으로 본인 Meta 광고 계정을 연동합니다. ads_management로 Marketing API에 접근해 연동된 광고 계정의 정보와 집계된 성과 데이터(노출·클릭·비용·전환)만 조회하며, 해당 클라이언트 전용 대시보드와 리포트에 표시합니다.
   - 캠페인·광고 세트·광고 생성·수정, 광고 집행, 계정 설정 변경은 하지 않습니다. 이용자가 연동을 허락한 계정의 지표만 조회용으로 사용합니다.

2) 이용자에게 제공하는 가치:
   - 고객사가 Meta/Facebook 광고 성과를 한곳에서 확인하고, 다른 채널(Google, 네이버 등)과 함께 내부 리포트 및 의사결정에 활용할 수 있습니다.

3) 해당 권한이 필요한 이유:
   - Marketing API에서 광고 계정·캠페인 수준 지표를 조회하려면 ads_management가 필요합니다. 없으면 서비스 핵심인 통합 마케팅 대시보드 및 리포트를 제공할 수 없습니다.

모든 데이터는 연동한 계정 소유자만 사용하며 제3자에게 판매·공유하지 않습니다. 개인정보 처리방침 및 데이터 삭제 안내는 앱 기본 설정에 있습니다.
```

---

## 2. 화면 녹화

- **데이터 연동** → **Meta OAuth** 클릭 → Facebook 인증 → 앱 복귀 → **광고 계정 ID 입력** → 저장 → **대시보드/리포트에서 Meta 성과 표시**되는 흐름을 1~3분 내외로 녹화 후 업로드.
- ads_read와 동일한 흐름을 사용해도 됩니다.

---

## 3. API 테스트 호출

- 폼에 **"ads_management 완료됨"** 이 이미 표시되어 있으면 별도 조치 없음. (Graph API 탐색기에서 5개 권한으로 호출해 두었다면 이미 완료된 상태입니다.)

---

## 4. 동의 체크박스

- **"승인되면 ads_management을(를) 통해 수신하는 모든 데이터를 허용되는 사용 방법에 따라 사용할 것이라는 데 동의합니다."** 에 **체크**.

---

## 5. 저장

- **저장** 버튼 클릭해 제출.

---

## 6. ads_management 제출 체크리스트

| 항목 | 확인 |
|------|------|
| 상세 설명란 | 위 영문(또는 한국어) 문단 붙여넣기 |
| 화면 녹화 | Meta OAuth → 광고 계정 ID 입력 → 대시보드 성과 표시 업로드 |
| API 테스트 | ads_management 완료됨 표시 확인 |
| 동의 체크박스 | 체크 후 저장 |

---

# pages_read_engagement 권한 요청 (별도 폼용)

Meta에서 **"pages_read_engagement 기능을 요청하는 이유를 알려주세요"** 폼에 넣을 내용입니다.  
(페이지 게시물·팔로워·인사이트 등 engagement 데이터 조회용 권한)

---

## 1. 상세 설명란에 넣을 내용 (복사해서 사용)

**영문 (권장):**

```
Our app "Onecation" (원마케팅) is a B2B marketing dashboard for businesses. We request pages_read_engagement for the following use only:

1) How we use this permission:
   - Page administrators (our clients) connect their Meta/Facebook account via Facebook Login. We use pages_read_engagement to read engagement data (e.g. post reach, reactions, comments) and page-level insights for the pages they manage. This data is shown in the client's private dashboard alongside their ad performance, so they can manage their page and see a unified view of both organic engagement and paid ad results.
   - We use only aggregated or de-identified insight data as permitted. We do not use this data for re-identification or for advertising targeting outside the app.

2) Value to users:
   - Page admins can see how their page content performs (engagement, reach) in one place with their ad metrics. This helps them manage their Facebook presence and make better decisions for reporting and content strategy.

3) Why this permission is necessary:
   - Without pages_read_engagement we cannot retrieve page engagement and insights via the Graph API. Showing this alongside ad performance is necessary to provide a complete marketing dashboard for our paying clients who manage Facebook pages and ads.

All data is used only for the account owner who connected it; we do not share or sell it. Privacy Policy and Data Deletion instructions are in the app Basic Settings.
```

**한국어 (보조용):**

```
본 앱 "원케이션(원마케팅)"은 B2B 마케팅 대시보드입니다. pages_read_engagement 권한은 아래와 같이만 사용합니다.

1) 권한 사용 방식:
   - 페이지 관리자(고객사)가 Facebook 로그인으로 계정을 연동합니다. 연동된 페이지의 게시물 도달·반응·댓글 등 engagement 데이터와 페이지 인사이트를 조회해, 해당 클라이언트 전용 대시보드에 광고 성과와 함께 표시합니다. 이를 통해 페이지 관리와 유기적 engagement·광고 성과를 한 화면에서 확인할 수 있게 합니다.
   - 허용된 범위에서 집계·비식별화된 인사이트만 사용하며, 재식별이나 앱 외 광고 타겟팅에는 사용하지 않습니다.

2) 이용자에게 제공하는 가치:
   - 페이지 관리자가 콘텐츠 성과(engagement, 도달)를 광고 지표와 한곳에서 확인하고, 리포트 및 콘텐츠 전략에 활용할 수 있습니다.

3) 해당 권한이 필요한 이유:
   - pages_read_engagement 없이는 Graph API로 페이지 engagement·인사이트를 조회할 수 없습니다. 광고 성과와 함께 이를 표시하는 것이, Facebook 페이지와 광고를 관리하는 고객을 위한 통합 마케팅 대시보드 제공에 필요합니다.

모든 데이터는 연동한 계정 소유자만 사용하며 제3자에게 판매·공유하지 않습니다. 개인정보 처리방침 및 데이터 삭제 안내는 앱 기본 설정에 있습니다.
```

---

## 2. 화면 녹화

- **데이터 연동** → **Meta OAuth** → Facebook 인증 → 앱 복귀 → **광고 계정/페이지 연동** → 대시보드에서 **페이지 engagement(게시물 반응·도달 등) 또는 인사이트**가 보이는 화면을 1~3분 내외로 녹화 후 업로드.
- 실제로 pages_read_engagement를 쓰는 화면(페이지 인사이트·게시물 성과 등)이 있으면 그 흐름을 보여주는 것이 좋습니다. 아직 없다면, Meta OAuth → 광고 성과 대시보드 흐름을 녹화한 뒤, 나중에 페이지 engagement를 같은 대시보드에 추가할 예정임을 설명에 포함해 두면 됩니다.

---

## 3. API 테스트 호출 (필수)

- `me?fields=id,name` 같은 호출은 **pages_read_engagement를 사용하지 않아서** "필요한 API 호출 0/1"이 해소되지 않습니다. **페이지(Page) 데이터를 읽는** 엔드포인트를 호출해야 합니다.
- **Graph API 탐색기**에서 아래 순서대로 진행하세요.

### 3-1. 토큰에 pages_read_engagement 포함

- 권한에 `pages_show_list`, `pages_read_engagement` 포함 → **액세스 토큰 생성** (이미 했다면 생략).

### 3-2. 1단계: 관리하는 페이지 목록 조회

- **GET** `me/accounts?fields=id,name`
- 응답에 나온 **페이지 ID** 하나를 복사해 둡니다. (페이지가 없으면 Facebook에서 테스트용 페이지를 하나 만든 뒤 다시 호출.)

### 3-3. 2단계: 페이지 정보/인사이트 조회 (pages_read_engagement 사용)

- **GET** `{페이지ID}?fields=id,name,fan_count`  
  예: `123456789012345?fields=id,name,fan_count`
- 또는 **GET** `{페이지ID}/insights?metric=page_impressions`  
  예: `123456789012345/insights?metric=page_impressions`

위 둘 중 **한 번이라도 성공**하면 pages_read_engagement를 사용한 API 호출로 인정됩니다. 완료 후 **최대 24시간** 내에 검수 화면에 "필요한 API 호출 1/1" 또는 "완료됨"으로 표시될 수 있습니다.

### 3-4. 주의

- 필수 테스트를 완료하지 않으면 검수 제출이 완료되지 않습니다. 위에서 입력한 설명·녹화를 **저장**한 뒤, 위 2단계 호출을 완료하고, 24시간 내에 이 폼으로 돌아와 "1/1" 확인 후 제출을 마무리하세요.
- **본인 또는 테스트 계정이 관리자인 Facebook 페이지**가 없으면 `me/accounts`가 빈 배열을 줄 수 있습니다. 그 경우 [Facebook에서 페이지 만들기](https://www.facebook.com/pages/creation/)로 페이지를 하나 만든 뒤 다시 시도하세요.

---

## 4. 동의 체크박스

- **"승인되면 pages_read_engagement을(를) 통해 수신하는 모든 데이터를 허용되는 사용 방법에 따라 사용할 것이라는 데 동의합니다."** 에 **체크**.

---

## 5. 저장

- **저장** 버튼 클릭해 제출. (API 테스트 1/1 완료 후 제출하는 것을 권장합니다.)

---

## 6. pages_read_engagement 제출 체크리스트

| 항목 | 확인 |
|------|------|
| 상세 설명란 | 위 영문(또는 한국어) 문단 붙여넣기 |
| 화면 녹화 | Meta OAuth → (페이지 engagement/인사이트 표시) 흐름 업로드 |
| API 테스트 | pages_read_engagement 필수 호출 1/1 완료 후 제출 |
| 동의 체크박스 | 체크 후 저장 |

---

# Graph API 탐색기로 필수 API 테스트 호출하기

Meta 검수에서 "필수 API 테스트 호출"을 요구할 때, **Graph API 탐색기**로 아래처럼 하면 됩니다.

1. **그래프 API 탐색기** 열기  
   - [developers.facebook.com](https://developers.facebook.com) → 앱 선택 → 도구 → **Graph API 탐색기** (또는 "도구" 메뉴에서 "Graph API Explorer" 검색).

2. **Meta 앱**  
   - 상단에서 **Meta 앱** 드롭다운으로 `onemarketing`(또는 해당 앱) 선택.

3. **액세스 토큰**  
   - **사용자 또는 페이지** → **사용자 토큰** 선택.  
   - **권한(Permissions)** 탭에서 필요한 권한만 추가 (예: `ads_read`, `ads_management`).  
   - **액세스 토큰 생성**(또는 "Generate Access Token") 클릭 → Facebook 로그인/동의 후 토큰이 채워짐.

4. **API 호출 한 번 실행**  
   - **메서드** `GET`, **엔드포인트** 예: `me?fields=id,name`  
   - **제출** 또는 **실행** 클릭.  
   - 응답에 `id`, `name` 등이 오고 "성공"으로 나오면, 해당 권한으로 API 호출이 1회 수행된 것으로 인정됩니다.

5. **검수 쪽 반영**  
   - 완료 후 최대 24시간 내에 앱 검수 화면에 "필수 API 호출 1/1 완료" 등으로 표시될 수 있음.  
   - **ads_read / ads_management:** 사용자 토큰에 해당 권한 넣고 `me?fields=id,name` 호출만 해도 테스트 호출로 인정되는 경우가 많음.  
   - **pages_read_engagement:** `me?fields=id,name` 은 인정되지 않음. 반드시 **페이지(Page) 엔드포인트**를 호출해야 함 → 먼저 `GET me/accounts?fields=id,name` 으로 페이지 ID를 받은 뒤, `GET {페이지ID}?fields=id,name,fan_count` 또는 `GET {페이지ID}/insights?metric=page_impressions` 중 하나를 호출하세요. 자세한 단계는 위 "pages_read_engagement 권한 요청"의 **3. API 테스트 호출** 참고.

---

# 데이터 처리 (Data Processing) — 검수 단계

Meta 앱 검수에서 **데이터 처리** 탭에 나오는 질문과 답변 예시입니다. 회사 상황에 맞게 수정해서 사용하세요.

---

## 1. 데이터 처리자/서비스 제공업체 (processor-0)

**질문:** Meta에서 얻은 플랫폼 데이터에 액세스할 수 있는 데이터 처리자 또는 서비스 제공업체(본인 회사 포함)가 있나요?

- **플랫폼 데이터:** Meta 사용자 ID, 이메일, 프로필 사진, 액세스 토큰, 앱 시크릿 등 Meta로부터 받는 모든 데이터.
- **데이터 처리자:** 회원님이 액세스할 수 있는 플랫폼 데이터를 회원님을 대신해 처리하는 별도 단체.

| 상황 | 선택 |
|------|------|
| Meta 토큰·데이터를 **Supabase, AWS 등 외부 서비스(DB/호스팅)**에 저장·처리하는 경우 | **예** → 다음 단계에서 해당 업체 이름 입력 (예: Supabase, Amazon Web Services). |
| **자사 서버만** 쓰고, Meta 데이터에 접근하는 제3자(대행사, 클라우드 DB 등)가 전혀 없는 경우 | **아니요** |

---

## 2. 데이터 책임자 (responsible-1)

**질문:** Meta가 회원님과 공유하는 모든 플랫폼 데이터에 대해 책임이 있는 사람 또는 단체는 누구인가요? (데이터 관리자에 해당하는 법인명)

- **입력 예:** `주식회사 98점7도` (또는 사업자등록증 상의 정식 법인명)
- 회사 이름이 다르면 해당 법인명으로 입력.

---

## 3. 책임자 소재 국가 (responsible-2)

**질문:** 해당 사람 또는 단체가 위치한 국가를 선택하세요.

- **선택:** `대한민국` (South Korea) — 또는 해당 법인이 있는 국가.

---

## 4. 국가 보안 관련 요청 (requests-3)

**질문:** 지난 12개월 동안 국가 보안 관련 요청에 따라 사용자 개인 데이터/개인 정보를 공공 기관에 제공한 적이 있나요? (수색 영장·범죄 조사 법원 명령은 제외)

- 일반적인 B2B 서비스인 경우: **아니요** 선택.

---

## 5. 공공 기관 요청 관련 정책 (requests-4)

**질문:** 공공 기관의 사용자 개인 데이터 요청과 관련해 다음 정책/절차가 있나요? 해당하는 항목을 모두 선택하세요.

- 개인정보 처리방침에 “당국 요청 시 법적 검토·이의 제기·최소 제공·문서화” 등을 적어 두었다면 해당 항목 선택.
- **선택 예 (가능한 것만):**
  - **이러한 요청의 합법성을 검토해야 하는 의무**
  - **요청이 합법적이지 않을 경우 요청에 이의를 제기하기 위한 조항**
  - **데이터 최소화 정책—필요한 최소한의 정보를 공개하는 능력**
  - **요청의 문서화(요청에 대한 응답, 법적 이유, 관련 행위자 포함)**
- 아무 것도 해당 없으면 **해당 사항 없음** 선택. (일부라도 있으면 있는 것만 선택하는 것을 권장.)

---

## 6. 데이터 처리 답변 체크리스트

| 항목 | 확인 |
|------|------|
| 데이터 처리자 유무 | 예 → 처리자 이름 입력 / 아니요 |
| 데이터 책임자(법인) | 주식회사 98점7도 등 법인명 |
| 소재 국가 | 대한민국 등 |
| 국가 보안 관련 제공 이력 | 없으면 “아니요” |
| 공공 기관 요청 정책 | 해당하는 것만 또는 “해당 사항 없음” |

---

# 검수자 지침 (Reviewer Instructions)

Meta 앱 검수에서 **검수자가 앱에 접근하는 방법**을 묻는 항목별 답변 예시입니다. 실제 URL·계정으로 수정해서 사용하세요.

---

## 1. 어디에서 앱을 찾을 수 있나요? (URL) *필수

**입력 예:**

```
https://www.onemarketing.kr
```

또는 로그인 페이지를 직접 안내할 경우:

```
https://www.onemarketing.kr/login
```

- 실제 서비스 도메인으로 바꿔서 입력하세요. 제출 전 **Meta Sharing Debugger** 등으로 해당 URL에 검수자가 접근 가능한지 확인하는 것을 권장합니다.

---

## 2. 검토를 완료할 수 있도록 앱에 액세스하는 방법 *필수

**입력 예 (영문):**

```
Our app is a B2B marketing dashboard. To access and test:

1) Log in: Open the URL above and log in with the test account provided below (Test login section).

2) Meta / Facebook Login usage: We use Facebook Login (OAuth) so that administrators can connect their clients' Meta (Facebook) ad accounts to our dashboard. The flow is:
   - After logging in as an administrator, go to [Admin] → [Clients] → select a client → [Data integration] tab.
   - Click the [Meta OAuth] button. You will be redirected to Facebook to authorize. After approval, you return to our app and can enter the Ad Account ID (e.g. act_123456789) and save.
   - Connected Meta ad performance (impressions, clicks, spend) is then displayed on the client's dashboard and in reports.
   We have submitted screencasts showing this Meta OAuth flow and the dashboard displaying ad metrics.

3) If the test account has the client role only: You can log in and see the dashboard (overview, reports) where Meta ad metrics appear after an admin has connected the account. The Meta OAuth connection itself is performed by an administrator as described above; the submitted screencasts demonstrate the full flow.
```

**입력 예 (한국어):**

```
본 앱은 B2B 마케팅 대시보드입니다. 접근 및 테스트 방법:

1) 로그인: 위 URL에 접속한 뒤, 아래 "테스트 로그인 정보"에 적힌 계정으로 로그인합니다.

2) Meta/Facebook 로그인 사용: 관리자가 고객사의 Meta(페이스북) 광고 계정을 우리 대시보드에 연동할 때 Facebook 로그인(OAuth)을 사용합니다.
   - 관리자로 로그인 후 [관리자] → [클라이언트 관리] → 클라이언트 선택 → [데이터 연동] 탭으로 이동합니다.
   - [Meta OAuth] 버튼을 클릭하면 Facebook 인증 화면으로 이동하며, 승인 후 앱으로 복귀해 광고 계정 ID(예: act_123456789)를 입력·저장할 수 있습니다.
   - 연동된 Meta 광고 성과(노출, 클릭, 비용)는 클라이언트 대시보드 및 리포트에 표시됩니다. 해당 Meta OAuth 흐름과 성과 표시 화면은 제출한 화면 녹화에서 확인할 수 있습니다.

3) 테스트 계정이 클라이언트 역할만 있는 경우: 로그인 후 개요·리포트 등 대시보드를 확인할 수 있으며, 관리자가 연동을 완료한 경우 Meta 광고 지표가 표시됩니다. Meta OAuth 연동 자체는 관리자가 위 순서대로 수행하며, 제출한 화면 녹화에 전체 흐름이 포함되어 있습니다.
```

---

## 3. 결제/멤버십이 필요한 경우 — 테스트 로그인 정보 *해당 시

**입력 예:**

```
Test account (for reviewer login):
Email: demo@gmail.com
Password: [실제 데모 비밀번호 입력, 예: Admin123!]

The above account has access to the dashboard. No payment or membership is required to access the Meta OAuth integration or the screens we use the requested permissions for. If you need an administrator account to test the Meta OAuth button flow (Admin → Clients → Data integration → Meta OAuth), please contact us and we will provide one.
```

- **비밀번호**는 실제 데모/검수용 계정 비밀번호로 채우세요. 제출 후 1년 동안 사용 가능한 계정을 제공하는 것이 좋습니다.
- **관리자(admin) 계정**이 따로 있으면, 검수자가 Meta OAuth 버튼을 직접 눌러 볼 수 있도록 그 계정 정보를 여기 또는 연락처와 함께 안내하면 됩니다.

---

## 4. 앱 스토어 기프트 코드

- **웹앱만** 제공하고 앱 스토어 다운로드가 없는 경우: **비워두거나** "N/A – this is a web application only, no app store download." 등으로 표기.

---

## 5. 지역/지오 블로킹 제한

- **특정 지역만 접근 가능한 제한이 없으면:** 비워두거나 "None. The app is accessible globally." / "해당 없음. 전 세계에서 접근 가능합니다." 로 표기.
- **한국 등 특정 국가만 접근 가능한 경우:** "Access may be limited to [country]. Reviewers can use a VPN or we can provide a test account; contact us if needed." 등으로 검수자가 접근할 수 있는 방법을 간단히 적습니다.
