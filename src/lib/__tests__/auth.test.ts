import { describe, it, expect, vi } from "vitest";

// Next.js 모듈 mock (테스트 환경에서 사용 불가)
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("isModuleEnabled", () => {
  it("modules가 null이면 false", async () => {
    const { isModuleEnabled } = await import("@/lib/auth");
    expect(isModuleEnabled(null, "reports")).toBe(false);
  });

  it("modules가 undefined이면 false", async () => {
    const { isModuleEnabled } = await import("@/lib/auth");
    expect(isModuleEnabled(undefined, "reports")).toBe(false);
  });

  it("해당 모듈이 true면 true", async () => {
    const { isModuleEnabled } = await import("@/lib/auth");
    expect(isModuleEnabled({ reports: true } as never, "reports")).toBe(true);
  });

  it("해당 모듈이 false면 false", async () => {
    const { isModuleEnabled } = await import("@/lib/auth");
    expect(isModuleEnabled({ reports: false } as never, "reports")).toBe(false);
  });
});

describe("getSession", () => {
  it("유저가 없으면 null 반환", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);

    const { getSession } = await import("@/lib/auth");
    const result = await getSession();
    expect(result).toBeNull();
  });

  it("프로필이 없으면 null 반환", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const chain = { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockResolvedValue({ data: null, error: null });

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } }, error: null }) },
      from: vi.fn(() => chain),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const result = await getSession();
    expect(result).toBeNull();
  });

  it("프로필 있고 client_id 없으면 client:null로 세션 반환", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const profileRow = { user_id: "u1", role: "admin", client_id: null, display_name: "테스트", email: "a@b.com", company_name: null, phone: null, must_change_password: false, created_at: "2025-01-01T00:00:00Z" };
    const chain = { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockResolvedValue({ data: profileRow, error: null });

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com" } }, error: null }) },
      from: vi.fn(() => chain),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result?.id).toBe("u1");
    expect(result?.profile.role).toBe("admin");
    expect(result?.client).toBeNull();
  });

  it("프로필 + client_id 있으면 client 포함 세션 반환", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const profileRow = { user_id: "u1", role: "client", client_id: "c1", display_name: "클라이언트", email: "c@b.com", company_name: "테스트사", phone: "01012345678", must_change_password: false, created_at: "2025-01-01T00:00:00Z" };
    const clientRow = { id: "c1", name: "테스트사" };
    const chain = { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single
      .mockResolvedValueOnce({ data: profileRow, error: null })
      .mockResolvedValueOnce({ data: clientRow, error: null });

    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "c@b.com" } }, error: null }) },
      from: vi.fn(() => chain),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const result = await getSession();
    expect(result?.client).toEqual(clientRow);
    expect(result?.profile.client_id).toBe("c1");
  });
});
