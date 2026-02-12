# SQL 실행 순서

Supabase Dashboard > **SQL Editor**에서 아래 순서대로 실행하세요.

| 순서 | 폴더 | 파일 | 설명 |
|------|------|------|------|
| 1 | `01-schema` | `schema.sql` | 테이블, 인덱스, RLS, 트리거 (가장 먼저) |
| 2 | `02-storage` | `storage.sql` | Storage 버킷(reports, assets) 및 정책 |
| 3 | `03-seed` | `seed.sql` | 데모 클라이언트 + KPI 정의 |
| 4 | `03-seed` | `profiles.sql` | 프로필 등록 (Auth 사용자 생성 후 실행, 여러 번 실행 가능) |

## 주의

- **01-schema**는 새 프로젝트에서 한 번만 실행합니다.
- **02-storage**는 버킷이 없을 때 실행합니다. 이미 있으면 `ON CONFLICT`로 스킵됩니다.
- **03-seed/seed.sql** 실행 후 Auth에서 사용자(admin, test)를 만들고, **profiles.sql**을 실행하세요. 기존 프로필은 삭제 후 다시 넣으므로 재실행 가능합니다.
