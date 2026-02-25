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
