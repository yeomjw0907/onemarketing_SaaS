# 성과 지표 자동화 — Meta / GA 연동에서 가져오기

> Meta(페이스북/인스타 광고)나 Google Analytics(GA4)를 연결하면 **연동된 데이터를 바탕으로 성과 지표를 자동 반영**할 수 있습니다.  
> 이 문서는 “매번 수동 입력” 대신 **자동화하는 방법**을 정리합니다.

---

## 1. 현재 구조 요약

| 구분 | 테이블 | 설명 |
|------|--------|------|
| **플랫폼 원시 데이터** | `platform_metrics` | Meta/GA/네이버 등 연동 시 **일별**로 수집된 지표 (동기화 엔진이 저장) |
| **성과 지표 (화면)** | `metrics` | 관리자 **성과 지표 탭**에서 보는 데이터. **주간/월간** 단위, `metric_key`(KPI 정의와 연결) |

- **Meta/GA를 연결**하면 → 동기화 시 **`platform_metrics`** 에 일별 데이터가 쌓입니다.
- **성과 지표 탭**은 **`metrics`** 테이블을 읽습니다.
- 따라서 **자동화**란: `platform_metrics` 를 **주간/월간으로 집계**해서 **`metrics`** 에 넣어 주는 과정입니다.

---

## 2. “연동하면 거기서 따올 수 있나?” → **가능합니다**

- **Meta Ads**: Marketing API로 광고 비용(spend), 전환 수(conversions), 노출수(impressions) 등을 **일별**로 가져와 `platform_metrics` 에 저장할 수 있습니다.
- **GA4**: Analytics Data API로 세션, 전환, 이벤트 수 등을 **일별**로 가져와 `platform_metrics` 에 저장할 수 있습니다.

이미 **데이터 연동 탭**에서 Meta/GA 연동 + **수동 동기화(🔄)** 를 하면 `platform_metrics` 에 데이터가 쌓입니다.  
여기에 **“주간/월간 집계 → `metrics` 반영”** 단계만 추가하면, **성과 지표를 자동으로 채울 수 있습니다.**

---

## 3. 자동화 구현 방향

### 3-1. 매핑 정리

- **KPI 정의**의 `metric_key`(예: `sales`, `conversions`, `page_views`)와  
  **플랫폼에서 오는 지표 이름**을 1:1로 매핑해야 합니다.

예시:

| KPI (metric_key) | Meta Ads 필드 | GA4 필드 |
|------------------|----------------|----------|
| `sales` | `spend` (또는 전환 가치) | - |
| `conversions` | `actions` 중 전환 이벤트 | `conversions` |
| `page_views` | - | `screenPageViews` |

- 각 플랫폼 fetcher(`meta.ts`, `ga4.ts` 등)에서 **저장하는 `metric_key`** 를 위와 맞추거나,  
  **집계 job** 안에서 “플랫폼 키 → KPI metric_key” 변환 테이블을 두면 됩니다.

### 3-2. 집계 Job 설계

1. **대상**  
   - `data_integrations` 에서 해당 클라이언트의 **활성 연동** 목록 조회  
   - 각 연동에 대해 `platform_metrics` 에 **해당 기간** 데이터가 있는지 확인

2. **기간**  
   - “어제까지” 또는 “지난 주/지난 달” 등으로 **집계 구간** 결정  
   - 주간: 해당 주의 `period_start`, `period_end`  
   - 월간: 해당 월의 1일 ~ 말일

3. **집계**  
   - `platform_metrics` 에서  
     `client_id`, `metric_key`(또는 매핑 후의 KPI `metric_key`), `metric_date`  
     로 **SUM(metric_value)**  
   - 주간이면 주별, 월간이면 월별로 그룹핑

4. **저장**  
   - `metrics` 테이블에 **insert** (해당 `client_id`, `period_type`, `period_start`, `period_end`, `metric_key`, `value`)  
   - 이미 같은 (client_id, period_type, period_start, period_end, metric_key) 행이 있으면 **update** (또는 upsert)

5. **실행 주기**  
   - **Vercel Cron** (또는 서버 cron): 매일 새벽 1회  
   - 또는 **수동 동기화** 후 “성과 지표 반영” 버튼을 눌렀을 때 같은 로직 호출

### 3-3. 구현 위치 제안

- **API 라우트**:  
  `POST /api/admin/sync-metrics-from-platform`  
  - 쿼리/바디: `clientId`(선택), `periodType`(weekly/monthly), `dateFrom`, `dateTo`  
  - 내부에서 위 “집계 → metrics 저장” 로직 수행  
  - 관리자만 호출 가능하도록 권한 체크

- **Cron**  
  - `GET /api/cron/sync-platform-metrics` (기존 연동 동기화) 뒤에  
  - 같은 요청 안에서 또는 별도 cron으로 `sync-metrics-from-platform` 로직 호출  
  - 모든 활성 클라이언트에 대해 “지난 주/지난 달” 집계 후 `metrics` 반영

---

## 4. 정리

| 질문 | 답변 |
|------|------|
| Meta/GA 연결하면 성과 지표 거기서 따올 수 있나? | **가능합니다.** 연동 시 `platform_metrics` 에 일별 데이터가 쌓이고, 이를 주간/월간으로 집계해 `metrics` 에 넣으면 됩니다. |
| 매번 수동 변경이 아니라 자동화하려면? | **매일(또는 주기적) 돌아가는 “집계 Job”**을 하나 두고, `platform_metrics` → `metrics` 로 집계·저장하면 됩니다. |
| 필요한 작업 | (1) 플랫폼 `metric_key` ↔ KPI `metric_key` 매핑 정의  
(2) `platform_metrics` 집계 후 `metrics` insert/update API (또는 서버 함수)  
(3) Vercel Cron 등으로 해당 API 주기 호출 |

위 순서로 구현하면 “연동만 해 두면 성과 지표가 자동으로 채워지는” 흐름을 만들 수 있습니다.
