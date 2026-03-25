# Benchmark Report — 원마케팅SaaS
**Date:** 2026-03-25
**URL:** http://localhost:3001 (Next.js 15 dev server)
**Branch:** main
**Mode:** Full audit (dev environment — multiply timing by ~0.4× for production estimate)

---

## Summary

| Grade | Score | Budget Pass | Regressions |
|-------|-------|-------------|-------------|
| **C+** | 62/100 | 4/7 | 1 critical (bundle size) |

---

## Page Timing Results

| Page | TTFB | FCP | DOM Interactive | Full Load | Requests | Transfer |
|------|------|-----|-----------------|-----------|----------|----------|
| `/` (→ /admin redirect) | 860ms | 1436ms | 1938ms | 2429ms | 13 | 2.9MB |
| `/login` | 808ms | 1040ms | 1495ms | 1975ms | 13 | 2.9MB |
| `/overview` (client) | 773ms | 1024ms | 1416ms | 1831ms | 13 | 2.9MB |
| `/admin` (dashboard) | 715ms | 768ms | 1176ms | 1663ms | 13 | 2.9MB |
| `/reports` (client) | 753ms | ~800ms | 1409ms | 1919ms | 13 | 2.9MB |
| `/admin/reports` | 653ms | ~700ms | 865ms | 1508ms | 13 | 2.9MB |

> **Dev mode caveat:** Next.js dev mode adds ~40–60% overhead vs production.
> Estimated production FCP: **300–600ms**, Full Load: **600–1000ms**.

---

## Bundle Size Analysis

### JavaScript Chunks (dev, gzip compressed)

| Chunk | Transfer (gzip) | Decoded | Notes |
|-------|-----------------|---------|-------|
| `main-app.js` | **1,715 KB** | ~7.4 MB | ⚠️ Global shared chunk — every page loads this |
| `layout.js` | 691 KB | ~2.8 MB | App/portal layout |
| `page.js` (portal) | 231 KB | ~1.0 MB | Per-page chunk |
| `error.js` | 130 KB | ~0.5 MB | Error boundary |
| `app-pages-internals.js` | 61 KB | ~0.25 MB | Next.js internals |
| `tiptap-editor.tsx.js` | *(lazy)* | 3.1 MB raw | ✅ Correctly lazy-loaded via `dynamic()` |
| `tosspayments-esm.js` | *(lazy)* | ~24 KB | ✅ Correctly lazy-loaded |
| **Total JS (gzip)** | **2,892 KB** | **12.4 MB** | ❌ Over budget |

### CSS

| File | Size |
|------|------|
| `layout.css` | 19 KB |
| **Total CSS** | **19 KB** ✅ |

---

## Performance Budget Check

| Metric | Budget | Actual (dev) | Est. Prod | Status |
|--------|--------|--------------|-----------|--------|
| FCP | < 1,800ms | 768–1,436ms | ~400–700ms | ✅ PASS |
| LCP | < 2,500ms | ~1,800ms est. | ~800ms est. | ✅ PASS |
| DOM Interactive | < 3,000ms | 865–1,938ms | ~500–900ms | ✅ PASS |
| Total JS (gzip) | < 500 KB | **2,892 KB** | ~800 KB est. | ❌ FAIL |
| Total CSS | < 100 KB | 19 KB | 19 KB | ✅ PASS |
| Total Transfer | < 2 MB | 2.9 MB | ~1.2 MB est. | ⚠️ WARNING |
| HTTP Requests | < 50 | 13 | ~13 | ✅ PASS |

**Grade: C+ (4/7 passing)**

---

## Top Issues Found

### 🔴 CRITICAL — `main-app.js` 번들 과비대 (1.7MB gzip)
- **모든 페이지**가 동일한 2.9MB(gzip) JS를 로드
- 로그인 페이지 같은 단순한 페이지도 Recharts, TipTap extension 코드를 포함
- **원인:** 대형 라이브러리들이 app-level 공유 청크에 묶임
- **권장:** recharts, @tiptap/* 패키지를 `dynamic()` 또는 route-level 분리 적용

### 🟠 HIGH — TTFB 650–860ms (미들웨어 DB 쿼리)
- 모든 요청에서 `getProfile()` + `getSubscriptionStatus()` Supabase 쿼리 실행
- 두 쿼리가 직렬로 실행됨 (admin 경로에서)
- **권장:** 미들웨어에 `Promise.all()` 병렬화 + 짧은 TTL Edge Config 또는 쿠키 캐시 적용

### 🟡 MEDIUM — TipTap lazy-load 확인됨 ✅
- `dynamic(() => import('@/components/tiptap-editor'))` 패턴 올바르게 적용
- 리포트 편집 페이지에서만 3.1MB 청크 로드 → 정상

### 🟡 MEDIUM — `isomorphic-dompurify` node_modules 누락
- `package.json`에 선언되어 있으나 `node_modules`에 없음 → **프로덕션 빌드 실패**
- `npm install` 후 해결됨 (node_modules에 설치됨, package-lock.json 변경 없음)
- **권장:** `npm ci` 기반 배포 파이프라인에서 확인 필요

---

## Slowest Resources

```
TOP 5 SLOWEST SCRIPTS (dev)
#   Resource             Transfer    Duration    Note
1   main-app.js          1,715 KB    446–551ms   ← 전체 앱 공유 번들
2   layout.js              691 KB    205–276ms   ← 레이아웃 청크
3   page.js (portal)       231 KB     58–71ms
4   error.js               130 KB     47–59ms
5   app-pages-internals     61 KB     31–44ms
```

---

## Recommendations (우선순위 순)

### 1. 미들웨어 DB 쿼리 병렬화 (TTFB -200ms 예상)
```typescript
// 현재: 직렬
const profile = await getProfile(user.id);
const sub = await getSubscriptionStatus(profile.agency_id);

// 권장: 병렬
const [profile, sub] = await Promise.all([
  getProfile(user.id),
  getSubscriptionStatus(agencyId)  // agencyId를 쿠키/JWT claim에서 읽기
]);
```

### 2. Recharts dynamic import (번들 -200KB gzip 예상)
```typescript
// 현재: 직접 import
import { BarChart, LineChart, ... } from "recharts";

// 권장: dynamic import로 청크 분리
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart));
```

### 3. 프로덕션 빌드 검증 (`isomorphic-dompurify`)
```bash
npm ci && npm run build
# 현재 실패 → isomorphic-dompurify node_modules 확인 필요
```

---

## Baseline Saved

이 데이터가 첫 번째 기준선(baseline)입니다. 다음 `/benchmark` 실행 시 이 값과 비교합니다.

```json
{
  "date": "2026-03-25",
  "branch": "main",
  "env": "dev",
  "pages": {
    "/login": { "ttfb_ms": 808, "fcp_ms": 1040, "dom_interactive_ms": 1495, "full_load_ms": 1975 },
    "/overview": { "ttfb_ms": 773, "fcp_ms": 1024, "dom_interactive_ms": 1416, "full_load_ms": 1831 },
    "/admin": { "ttfb_ms": 715, "fcp_ms": 768, "dom_interactive_ms": 1176, "full_load_ms": 1663 },
    "/admin/reports": { "ttfb_ms": 653, "fcp_ms": 700, "dom_interactive_ms": 865, "full_load_ms": 1508 }
  },
  "bundles": {
    "total_transfer_kb": 2940,
    "js_transfer_kb": 2892,
    "css_transfer_kb": 19,
    "total_requests": 13
  }
}
```
