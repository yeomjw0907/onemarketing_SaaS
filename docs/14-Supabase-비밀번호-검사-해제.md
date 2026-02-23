# Supabase 비밀번호 강도 검사 해제 (관리자 비밀번호 리셋용)

관리자 화면에서 비밀번호 리셋 시 **"Password is known to be weak and easy to guess"** 오류가 나는 경우, Supabase에서 유출 비밀번호 검사를 끄면 해당 비밀번호(예: Admin123!)도 사용할 수 있습니다.

## 해제 방법

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인 후 **해당 프로젝트** 선택
2. 왼쪽 메뉴 **Authentication** → **Providers** (또는 **Auth** → **설정**)
3. **Email** 제공자 설정에서 **Password** 관련 옵션 확인
4. **"Prevent the use of leaked passwords"** (유출된 비밀번호 사용 방지) 옵션을 **해제**
5. 저장

> Pro Plan 이상에서 해당 옵션이 보입니다. Free Plan에서는 옵션이 없거나 기본 적용일 수 있습니다.

이렇게 하면 관리자 비밀번호 리셋 시 Supabase가 약한/유출 비밀번호로 판단하는 값도 설정할 수 있습니다. 보안상 내부 관리용으로만 사용하고, 고객 계정은 강한 비밀번호를 권장하세요.
