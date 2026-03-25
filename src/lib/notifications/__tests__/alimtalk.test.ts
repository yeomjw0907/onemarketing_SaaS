import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendAlimtalk } from "../alimtalk";

// crypto는 Node 내장 — 별도 mock 불필요

describe("sendAlimtalk", () => {
  beforeEach(() => {
    vi.stubEnv("SOLAPI_PFID", "test-pfid");
    vi.stubEnv("SOLAPI_API_KEY", "test-key");
    vi.stubEnv("SOLAPI_API_SECRET", "test-secret");
  });

  it("templateId가 비어있으면 발송하지 않고 에러 반환", async () => {
    const result = await sendAlimtalk({ to: "01012345678", templateId: "", variables: {} });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/templateId/);
  });

  it("templateId가 공백만 있어도 에러 반환", async () => {
    const result = await sendAlimtalk({ to: "01012345678", templateId: "   ", variables: {} });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/templateId/);
  });

  it("전화번호 형식이 잘못되면 에러 반환", async () => {
    const result = await sendAlimtalk({ to: "123", templateId: "KA01TP_valid", variables: {} });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/전화번호/);
  });

  it("SOLAPI_PFID가 없으면 에러 반환", async () => {
    vi.stubEnv("SOLAPI_PFID", "");
    const result = await sendAlimtalk({ to: "01012345678", templateId: "KA01TP_valid", variables: {} });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SOLAPI_PFID/);
  });

  it("API 호출 성공 시 success:true 반환", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ groupId: "G4V20180906105832594MK3MIXFB0B0", count: { total: { requested: 1, failed: 0, success: 1 } } }),
    }));

    const result = await sendAlimtalk({ to: "01012345678", templateId: "KA01TP_valid", variables: { name: "테스트" } });
    expect(result.success).toBe(true);
  });

  it("API 오류 응답 시 success:false 반환", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errorCode: "InvalidTemplateId", errorMessage: "템플릿 없음" }),
    }));

    const result = await sendAlimtalk({ to: "01012345678", templateId: "KA01TP_invalid", variables: {} });
    expect(result.success).toBe(false);
  });
});
