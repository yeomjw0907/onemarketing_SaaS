# Windows EPERM (.next/trace) 트러블슈팅

> `npm run dev` 시 **EPERM: operation not permitted, open '.next\trace'** 가 반복될 때 참고하세요.

---

## 원인

- **OneDrive**가 프로젝트 폴더를 동기화하면서 `.next` 내부 파일을 잠그는 경우
- **백신/보안 프로그램**이 `.next`를 스캔·잠그는 경우
- 이전에 실행한 dev 서버가 완전히 종료되지 않은 경우

Next.js는 개발 서버 시작 시 `.next/trace` 파일을 쓰는데, 위 상황에서 Windows가 해당 파일 접근을 막아 EPERM이 발생합니다.

---

## 해결 방법

### 1. 가장 추천하는 방법: 프로젝트 폴더 이동 (Best Practice)

장기적으로는 **개발 프로젝트를 OneDrive가 감시하지 않는 경로**로 옮기는 게 정신 건강에 좋습니다.

| 현재 (문제 발생하기 쉬움) | 추천 (OneDrive 밖) |
|---------------------------|---------------------|
| `C:\Users\사용자명\OneDrive\바탕 화면\MyProject` | `C:\MyProjects\원마케팅SaaS` |
| OneDrive 동기화 폴더 안 | `C:\Users\사용자명\Dev\원마케팅SaaS` |

- OneDrive 폴더 밖으로 옮기면 `.next` 잠금·동기화 충돌이 사라집니다.
- 이동 후 Cursor/VS Code에서 **File → Open Folder**로 새 경로를 열면 됩니다.
- Git이 이미 켜져 있다면 폴더만 옮겨도 저장소는 그대로 유지됩니다.

**자동 복사 스크립트 (PowerShell):**

1. PowerShell을 **관리자 권한 없이** 열고, 프로젝트 폴더로 이동한 뒤:
   ```powershell
   cd "C:\Users\사용자명\OneDrive\Desktop\원마케팅SaaS"
   .\scripts\move-project-out-of-onedrive.ps1
   ```
2. 스크립트가 `C:\MyProjects\원마케팅SaaS`로 복사합니다. (node_modules, .next 제외)
3. 복사가 끝나면 Cursor에서 **File → Open Folder** → `C:\MyProjects\원마케팅SaaS` 선택.
4. 새 폴더에서 터미널 열고 `npm install` → `npm run dev` 로 확인.
5. 문제없으면 기존 OneDrive 안의 프로젝트 폴더는 삭제해도 됩니다.

### 2. 권장: `dev:safe` 스크립트 사용

`.next`를 삭제한 뒤 곧바로 개발 서버를 띄웁니다.

```bash
npm run dev:safe
```

EPERM이 자주 난다면 평소에 `npm run dev` 대신 `npm run dev:safe`로 실행해도 됩니다. (매번 .next를 지우므로 첫 로딩이 조금 더 걸릴 수 있음)

### 3. 수동: clean 후 dev

```bash
npm run clean
npm run dev
```

### 4. 그래도 안 될 때

- **dev 서버를 모두 종료**한 뒤 (다른 터미널/IDE에서 실행 중인 `next dev` 확인)
- **파일 탐색기**에서 프로젝트 폴더의 `.next` 폴더를 직접 삭제
- OneDrive에서 해당 폴더 동기화를 잠시 중지하거나, `.next`를 동기화 제외 후 다시 `npm run dev`

---

## 스크립트 설명

| 스크립트 | 설명 |
|----------|------|
| `npm run clean` | `.next` 폴더만 삭제 (Node 스크립트로 삭제해 Windows 경로/잠금 이슈 완화) |
| `npm run dev:safe` | `clean` 실행 후 `next dev` 실행 |

삭제 로직은 `scripts/clean-next.js`에 있습니다.
