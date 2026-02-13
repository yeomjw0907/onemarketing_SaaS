/**
 * Vercel Cron Job — 모든 활성 연동의 데이터 동기화 (Meta/GA/네이버 등 → platform_metrics)
 * 매일 1회 실행 (0 21 * * * = UTC 21:00, 한국 새벽 06:00)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { syncAllActive } from "@/lib/integrations/sync-engine";

export const runtime = "nodejs";
export const maxDuration = 300; // 5분

export async function GET(req: NextRequest) {
  // Vercel cron 인증 (보안)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role 클라이언트 (cookies 불필요)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  // 최근 7일
  const now = new Date();
  const dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const dateTo = now.toISOString().split("T")[0];

  const result = await syncAllActive(supabase, dateFrom, dateTo);

  return NextResponse.json({
    message: `동기화 완료: ${result.succeeded}/${result.total} 성공`,
    ...result,
  });
}
