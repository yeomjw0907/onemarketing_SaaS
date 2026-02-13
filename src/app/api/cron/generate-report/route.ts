/**
 * Vercel Cron Job — AI 보고서 자동 생성
 * 매주 월요일 00:00 UTC (한국 09:00) 실행
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { autoGenerateAndPublish } from "@/lib/ai/report-generator";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  // 활성 클라이언트 중 연동이 있는 것들
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("is_active", true);

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: "활성 클라이언트 없음" });
  }

  const now = new Date();
  const dateTo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dateFrom = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const results = [];

  for (const client of clients) {
    // 연동이 있는 클라이언트만
    const { count } = await supabase
      .from("data_integrations")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id)
      .eq("status", "active");

    if (!count || count === 0) continue;

    try {
      const result = await autoGenerateAndPublish(
        supabase,
        client.id,
        client.name,
        "weekly",
        dateFrom,
        dateTo,
      );

      results.push({
        clientId: client.id,
        clientName: client.name,
        success: !!result,
        reportId: result?.reportId,
      });
    } catch (err: any) {
      results.push({
        clientId: client.id,
        clientName: client.name,
        success: false,
        error: err.message,
      });
    }
  }

  return NextResponse.json({
    message: `AI 보고서 생성 완료: ${results.filter(r => r.success).length}/${results.length}건`,
    results,
  });
}
