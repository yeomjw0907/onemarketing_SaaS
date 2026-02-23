/**
 * 수동 동기화 트리거 API (관리자 전용)
 * POST { integrationId, dateFrom?, dateTo? }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { syncIntegration } from "@/lib/integrations/sync-engine";

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { integrationId, dateFrom, dateTo } = body;

  if (!integrationId) {
    return NextResponse.json({ error: "integrationId 필수" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: integration, error } = await supabase
    .from("data_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (error || !integration) {
    return NextResponse.json({ error: "연동을 찾을 수 없습니다." }, { status: 404 });
  }

  // 기본값: 최근 7일
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultTo = now.toISOString().split("T")[0];

  const result = await syncIntegration(
    supabase,
    integration,
    dateFrom || defaultFrom,
    dateTo || defaultTo,
  );

  return NextResponse.json(result);
}
