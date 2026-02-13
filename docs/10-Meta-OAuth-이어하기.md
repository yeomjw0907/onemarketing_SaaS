# Meta OAuth 연동 — 내일 이어하기

> 오늘까지 한 것과, 내일 할 순서·확인할 것 정리.

---

## 1. 지금까지 한 것

- [x] Meta 앱 생성 (onemarketing), 이용 사례: **마케팅 API로 광고 성과 데이터 측정**
- [x] **비즈니스용 Facebook 로그인** 추가, **유효한 OAuth 리디렉션 URI** 등록  
  `http://localhost:3000/api/auth/meta/callback`  
  `https://www.onemarketing.kr/api/auth/meta/callback`
- [x] `.env.local`에 `META_APP_ID`, `META_APP_SECRET` 설정
- [x] 코드 수정: Facebook에서 돌아온 뒤 **URL의 metaToken**을 읽어서 **광고 계정 ID 입력 후 저장**하는 폼 추가 (데이터 연동 탭)
- [x] 콜백 후 **데이터 연동 탭**이 자동으로 열리도록 `?tab=integrations` 반영

---

## 2. 내일 할 순서 (한 번에)

1. **개발 서버 실행**  
   `npm run dev` → `http://localhost:3000`

2. **관리자 로그인**  
   관리자 계정으로 로그인 후 **클라이언트** → 테스트할 클라이언트(예: 성신컴퍼니) 선택

3. **데이터 연동 탭**  
   **데이터 연동** 탭 클릭

4. **Meta OAuth**  
   **Meta OAuth** 버튼 클릭 →  
   - App ID 입력 창이 뜨면: `.env.local`의 `META_APP_ID` 값 입력 (예: `25788595570801182`)  
   - Facebook **다시 연결** 화면에서 **다시 연결** 클릭

5. **돌아온 뒤 (같은 클라이언트 데이터 연동 탭)**  
   - **"Meta 인증이 완료되었습니다"** 카드가 보이면  
   - **광고 계정 ID** 입력 (예: `act_123456789`)  
     - 확인: [Meta 비즈니스 설정](https://business.facebook.com/settings) → 광고 계정 → 광고 계정 ID  
   - **연동 저장** 클릭

6. **확인**  
   - 데이터 연동 목록에 **Meta Ads** 항목이 생기면 성공  
   - **🔄 수동 동기화** 눌러서 데이터 수집 테스트

---

## 3. 안 될 때 확인할 것

| 현상 | 확인 |
|------|------|
| Meta OAuth 버튼 눌러도 Facebook으로 안 넘어감 | 주소창 URL이 `http://localhost:3000`인지, App ID 입력값이 `.env.local`의 `META_APP_ID`와 같은지 |
| Facebook에서 다시 연결 후 빈 화면/에러 | 브라우저 주소창에 `metaToken=...` 이 있는지. 있으면 같은 페이지에서 **데이터 연동** 탭이 선택돼 있는지 |
| "Meta 인증이 완료되었습니다" 카드가 안 보임 | URL에 `?tab=integrations&metaToken=...` 이 있는지. 없으면 콜백 쪽 에러 가능 → 터미널(npm run dev) 로그 확인 |
| 연동 저장 시 실패 | 광고 계정 ID 형식 `act_숫자`. 네트워크 탭/콘솔에서 API 에러 메시지 확인 |
| 연결됐는데 동기화 실패 | Meta 앱 권한(ads_read, ads_management), 광고 계정 ID가 해당 Facebook 계정 소유인지 확인 |

---

## 4. 관련 파일

- 콜백(토큰 받아서 리다이렉트): `src/app/api/auth/meta/callback/route.ts`
- 데이터 연동 탭 + Meta 저장 폼: `src/app/admin/clients/[id]/client-detail.tsx` (IntegrationTab, `metaTokenFromUrl`, `handleMetaSaveFromUrl`)
- 연동 API(저장): `src/app/api/admin/integrations/route.ts` (POST)
- 환경 변수: `.env.local` — `META_APP_ID`, `META_APP_SECRET`, `NEXT_PUBLIC_APP_URL`

---

내일 이 파일(`docs/10-Meta-OAuth-이어하기.md`) 열고 위 순서대로 하면 됩니다.
