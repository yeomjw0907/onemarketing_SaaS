# Onecation Client Portal

마케팅 에이전시를 위한 멀티테넌트 클라이언트 포털 SaaS.

- **첫 설정**: `docs/01-먼저-할-일.md` 참고
- **SQL 실행 순서**: `supabase/sql/README.md` 참고
- **문서 목차**: `docs/00-목차.md` 참고

## 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (Postgres + Auth + Storage)
- **Security**: Row Level Security (RLS)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local.example`을 `.env.local`로 복사하고 Supabase 프로젝트 정보를 입력하세요.

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Supabase 설정 (SQL 실행 순서)

**실행할 SQL은 `supabase/sql/` 폴더에 번호 순으로 정리되어 있습니다.** 자세한 내용은 `supabase/sql/README.md` 참고.

| 순서 | 경로 | 설명 |
|------|------|------|
| 1 | `supabase/sql/01-schema/schema.sql` | 테이블, 인덱스, RLS, 트리거 |
| 2 | `supabase/sql/02-storage/storage.sql` | Storage 버킷(reports, assets) 및 정책 |
| 3 | `supabase/sql/03-seed/seed.sql` | 데모 클라이언트 + KPI (선택) |

Supabase Dashboard > SQL Editor에서 위 순서대로 실행하세요. Auth 사용자 생성 후 프로필 등록은 **`docs/01-먼저-할-일.md`** 를 따라 하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 접속합니다.

## 로그인

- **Admin**: ID = `admin`, Password = `admin1234!`
- **Client**: ID = `democlient`, Password = `demo1234!`

로그인 시 내부적으로 `{ID}@onecation.client` 형식의 이메일로 변환되어 Supabase Auth에 인증합니다.

## 구조

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── login/page.tsx          # 로그인
│   ├── (portal)/               # Client Portal (route group)
│   │   ├── layout.tsx          # Sidebar + Header
│   │   ├── overview/           # 대시보드
│   │   ├── execution/          # 실행 내역
│   │   ├── calendar/           # 캘린더
│   │   ├── projects/           # 프로젝트
│   │   ├── reports/            # 리포트
│   │   ├── assets/             # 에셋
│   │   └── support/            # 지원
│   ├── admin/                  # Admin Console
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard
│   │   ├── clients/            # 클라이언트 관리
│   │   ├── kpis/               # KPI 정의
│   │   ├── metrics/            # 지표 입력
│   │   ├── actions/            # 액션 관리
│   │   ├── calendar/           # 이벤트 관리
│   │   ├── projects/           # 프로젝트 관리
│   │   ├── reports/            # 리포트 관리
│   │   ├── assets/             # 에셋 관리
│   │   └── preview/            # Shadow View
│   └── api/
│       └── files/signed-url/   # Signed URL API
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Sidebar, Header
│   ├── status-badge.tsx
│   ├── file-item-card.tsx
│   ├── module-guard.tsx
│   └── empty-state.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # Server Supabase client
│   │   ├── client.ts           # Browser Supabase client
│   │   └── middleware.ts       # Auth middleware
│   ├── types/
│   │   └── database.ts         # TypeScript types
│   ├── auth.ts                 # Session helpers
│   └── utils.ts                # Utility functions
├── middleware.ts                # Next.js middleware
supabase/
├── schema.sql                  # DB schema + RLS
└── seed.sql                    # Seed data
```

## 주요 기능

### Client Portal (읽기 전용)
- **Overview**: KPI 4카드 + 최근 실행 + 로드맵 + 리포트 + 에셋
- **Execution**: 액션 목록 (ID/카테고리 필터), 상세 페이지
- **Calendar**: 월/주/목록 뷰, 완료/예정 사이드 패널, 이벤트 모달 → 관련 실행 내역 이동
- **Projects**: 프로젝트 현황 카드
- **Reports**: 주간/월간 리포트 (보기/다운로드/URL 갱신)
- **Assets**: 브랜드 에셋 자료실
- **Support**: 카카오톡 상담 + 공지사항

### Admin Console
- 클라이언트 CRUD + 모듈 토글
- KPI 정의 + Validation Rules
- Actions, Projects, Calendar Events, Reports, Assets 생성/수정
- Metrics 입력 (KPI validation 적용)
- Shadow View (클라이언트 미리보기)

### 보안
- 모든 테이블 RLS 활성화
- 클라이언트는 자신의 데이터만 조회 가능
- Admin만 CUD 가능
- Signed URL로 파일 접근 (1시간 만료)
- 파일 접근 시 소유권 검증
