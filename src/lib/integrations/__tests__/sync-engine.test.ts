import { describe, it, expect, vi } from "vitest";
import { syncIntegration, syncAllActive } from "../sync-engine";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataIntegration } from "@/lib/types/database";

// ── 헬퍼: mock Supabase 빌더 ──
// Supabase 쿼리 빌더는 메서드 체이닝 후 await 시 resolve되어야 함.
// chain 자체를 thenable로 만들어 어디서 await 해도 동작하도록 처리.
function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    select: vi.fn().mockImplementation(() => chain),
    insert: vi.fn().mockImplementation(() => chain),
    update: vi.fn().mockImplementation(() => chain),
    delete: vi.fn().mockImplementation(() => chain),
    eq: vi.fn().mockImplementation(() => chain),
    in: vi.fn().mockImplementation(() => chain),
    single: vi.fn().mockResolvedValue({ data: { id: "log-1" }, error: null }),
  };
  // chain 자체를 awaitable하게 (update().eq() 등 single()로 끝나지 않는 체인)
  chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null });

  return {
    from: vi.fn(() => chain),
    ...overrides,
  } as unknown as SupabaseClient;
}

function makeIntegration(overrides: Partial<DataIntegration> = {}): DataIntegration {
  return {
    id: "int-1",
    client_id: "client-1",
    platform: "meta_ads",
    status: "active",
    credentials: {},
    last_synced_at: null,
    error_message: null,
    created_at: new Date().toISOString(),
    ...overrides,
  } as DataIntegration;
}

// ── 플랫폼 fetcher 모킹 ──
vi.mock("../meta", () => ({ fetchMetaMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../naver", () => ({ fetchNaverMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../google-ads", () => ({ fetchGoogleAdsMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../ga4", () => ({ fetchGA4Metrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../kakao-moment", () => ({ fetchKakaoMomentMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../google-search-console", () => ({ fetchSearchConsoleMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../tiktok-ads", () => ({ fetchTikTokAdsMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../naver-gfa", () => ({ fetchNaverGFAMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../shopify", () => ({ fetchShopifyMetrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../cafe24", () => ({ fetchCafe24Metrics: vi.fn().mockResolvedValue([]) }));
vi.mock("../linkedin-ads", () => ({ fetchLinkedInAdsMetrics: vi.fn().mockResolvedValue([]) }));

describe("syncIntegration", () => {
  it("지원하지 않는 플랫폼은 success:false 반환", async () => {
    const supabase = makeMockSupabase();
    const integration = makeIntegration({ platform: "unknown_platform" as never });
    const result = await syncIntegration(supabase, integration, "2025-01-01", "2025-01-07");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/지원하지 않는 플랫폼/);
  });

  it("fetcher 성공 시 success:true, recordCount 반환", async () => {
    const { fetchMetaMetrics } = await import("../meta");
    vi.mocked(fetchMetaMetrics).mockResolvedValueOnce([
      { client_id: "c1", integration_id: "int-1", platform: "meta_ads", metric_date: "2025-01-01", metric_key: "spend", metric_value: 100, dimensions: {}, raw_data: {} },
    ]);
    const supabase = makeMockSupabase();
    const result = await syncIntegration(supabase, makeIntegration(), "2025-01-01", "2025-01-07");
    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(1);
  });

  it("fetcher 예외 시 success:false, 에러 상태 업데이트", async () => {
    const { fetchMetaMetrics } = await import("../meta");
    vi.mocked(fetchMetaMetrics).mockRejectedValueOnce(new Error("API timeout"));
    const supabase = makeMockSupabase();
    const result = await syncIntegration(supabase, makeIntegration(), "2025-01-01", "2025-01-07");
    expect(result.success).toBe(false);
    expect(result.error).toBe("API timeout");
  });
});

describe("syncAllActive", () => {
  it("연동이 없으면 빈 결과 반환", async () => {
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: [], error: null }) })) })),
    } as unknown as SupabaseClient;
    const result = await syncAllActive(supabase, "2025-01-01", "2025-01-07");
    expect(result.total).toBe(0);
    expect(result.succeeded).toBe(0);
  });

  it("여러 연동을 병렬 처리하고 성공/실패 집계", async () => {
    const { fetchMetaMetrics } = await import("../meta");
    const { fetchNaverMetrics } = await import("../naver");
    vi.mocked(fetchMetaMetrics).mockResolvedValue([]);
    vi.mocked(fetchNaverMetrics).mockRejectedValueOnce(new Error("네이버 오류"));

    const integrations = [
      makeIntegration({ id: "int-1", platform: "meta_ads" }),
      makeIntegration({ id: "int-2", platform: "naver_ads" }),
    ];

    const chain = makeMockSupabase();
    // syncAllActive의 첫 from("data_integrations") 쿼리만 integrations 반환
    // from 첫 번째 호출 = data_integrations 조회, 이후 = sync 중 insert/update 등
    let fromCallCount = 0;
    const listChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: integrations, error: null }),
    };
    (chain.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return listChain;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = { select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "log-1" }, error: null }) };
      c.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
      return c;
    });
    const supabase = chain;

    const result = await syncAllActive(supabase, "2025-01-01", "2025-01-07");
    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
  });
});
