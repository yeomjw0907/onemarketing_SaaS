# Security Advisor 대응 가이드

Supabase Dashboard → **Security Advisor** 에서 제기되는 항목 요약과 조치 방법입니다.

---

## 1. Function Search Path Mutable

**의미:**  
함수에 `search_path`가 지정되어 있지 않으면, 악의적인 사용자가 다른 스키마에 같은 이름의 객체(테이블/함수)를 만들어 함수가 그쪽을 참조하게 할 수 있습니다(search path 조작).

**조치:**  
해당 함수들에 `SET search_path = public` 를 넣어, 항상 `public` 스키마만 보도록 고정했습니다.

**적용 SQL:**  
`supabase/sql/04-migrations/006-security-advisor-fixes.sql` 실행  
대상 함수: `public.is_admin`, `public.current_client_id`, `public.handle_updated_at`, `public.set_updated_at`

---

## 2. RLS Policy Always True (notification_logs)

**의미:**  
`notification_logs` 테이블의 `service_insert_notification_logs` 정책이 `WITH CHECK (true)` 로 되어 있어, **누구나** INSERT가 가능한 상태입니다. RLS가 사실상 뚫리는 것과 같습니다.

**조치:**  
해당 정책을 **삭제**했습니다.  
- 알림 발송 API는 **service_role** (`createServiceClient()`) 로 INSERT 하므로, RLS를 우회해 그대로 동작합니다.  
- 일반 사용자(anon/authenticated)는 INSERT 할 수 없게 되어 보안이 맞춰집니다.

**적용 SQL:**  
동일 마이그레이션 `006-security-advisor-fixes.sql` 에 포함.

---

## 3. Leaked Password Protection Disabled (Auth)

**의미:**  
Supabase Auth에서 “유출된 비밀번호” 차단(HaveIBeenPwned 연동)이 꺼져 있어, 이미 유출된 비밀번호도 가입/변경에 사용할 수 있습니다.

**조치 (대시보드에서 설정):**  
1. Supabase Dashboard → **Authentication** → **Providers**  
2. **Email** 선택  
3. **“Leaked password protection”** (또는 “Check for compromised passwords”) 옵션 **켜기**

이렇게 하면 가입·비밀번호 변경 시 유출된 비밀번호 사용이 막힙니다.

---

## 마이그레이션 실행 순서

이미 001~005 를 적용한 프로젝트라면, 아래만 실행하면 됩니다.

| 순서 | 경로 |
|------|------|
| 1 | `04-migrations/006-security-advisor-fixes.sql` |

Supabase Dashboard → **SQL Editor** 에서 해당 파일 내용을 붙여 넣고 실행하세요.
