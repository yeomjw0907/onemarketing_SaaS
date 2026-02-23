# SQL 실행 순서

Supabase Dashboard > **SQL Editor**에서 아래 순서대로 실행하세요.

## 새 프로젝트에서 처음 셋업할 때

| 순서 | 경로 | 설명 |
|------|------|------|
| 1 | `01-schema/schema.sql` | 테이블, 인덱스, RLS, 트리거 (가장 먼저) |
| 2 | `02-storage/storage.sql` | Storage 버킷(reports, assets) 및 정책 |
| 3 | `04-migrations/001-add-contact-fields.sql` | clients 담당자·연동·platform_metrics 등 |
| 4 | `04-migrations/002-notification-logs.sql` | 알림 발송 로그 테이블 |
| 5 | `04-migrations/003-enabled-services-schema-reload.sql` | enabled_services 컬럼 + 스키마 갱신 |
| 6 | `04-migrations/004-actions-end-date.sql` | 실행 항목 종료일(선택) |
| 7 | `04-migrations/004-service-urls.sql` | 클라이언트별 서비스 바로가기 URL |
| 8 | `04-migrations/005-mypage-profile-update-policies.sql` | 마이페이지 본인 프로필/담당자 정보 수정 RLS |
| 9 | `04-migrations/006-security-advisor-fixes.sql` | Security Advisor: 함수 search_path, notification_logs RLS |
| 10 | `03-seed/seed.sql` | 데모 클라이언트 + KPI 정의 (선택) |
| 11 | `03-seed/profiles.sql` | 프로필 등록 (Auth 사용자 생성 **후** 실행, 여러 번 가능) |

## 이미 schema + 001 적용된 프로젝트에만 추가할 때

아래만 순서대로 실행하면 됩니다.

| 순서 | 경로 |
|------|------|
| 1 | `04-migrations/002-notification-logs.sql` |
| 2 | `04-migrations/003-enabled-services-schema-reload.sql` |
| 3 | `04-migrations/004-actions-end-date.sql` |
| 4 | `04-migrations/004-service-urls.sql` |
| 5 | `04-migrations/005-mypage-profile-update-policies.sql` |
| 6 | `04-migrations/006-security-advisor-fixes.sql` |

## 주의

- **01-schema**는 새 프로젝트에서 한 번만 실행합니다.
- **02-storage**는 버킷이 없을 때 실행합니다. 이미 있으면 스킵 가능.
- **001-add-contact-fields.sql**은 `schema.sql` **이후** 실행 (clients 등 테이블이 있어야 함).
- **03-seed/seed.sql** 실행 후 Auth에서 사용자(admin, test)를 만들고, **profiles.sql**을 실행하세요.
