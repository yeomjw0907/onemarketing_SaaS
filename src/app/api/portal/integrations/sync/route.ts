/**
 * 포털 사용자용 수동 동기화 API
 * 로그인한 클라이언트가 자기 연동만 동기화할 수 있음.
 * POST { integrationId? } — 비우면 해당 클라이언트의 모든 활성 연동 동기화
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { syncIntegration } from "@/lib/integrations/sync-engine";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.profile?.client_id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const clientId = session.profile.client_id;
  const body = await req.json().catch(() => ({}));
  const { integrationId } = body;

  const supabase = await createServiceClient();

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const defaultTo = now.toISOString().split("T")[0];

  if (integrationId) {
    const { data: integration, error } = await supabase
      .from("data_integrations")
      .select("*")
      .eq("id", integrationId)
      .eq("client_id", clientId)
      .eq("status", "active")
      .single();

    if (error || !integration) {
      return NextResponse.json({ error: "연동을 찾을 수 없거나 권한이 없습니다." }, { status: 404 });
    }

    const result = await syncIntegration(supabase, integration, defaultFrom, defaultTo);
    return NextResponse.json(result);
  }

  const { data: integrations } = await supabase
    .from("data_integrations")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "active");

  if (!integrations?.length) {
    return NextResponse.json({ success: true, recordCount: 0, total: 0, succeeded: 0 });
  }

  let totalRecords = 0;
  let succeeded = 0;
  for (const integration of integrations) {
    const result = await syncIntegration(supabase, integration, defaultFrom, defaultTo);
    if (result.success) {
      succeeded += 1;
      totalRecords += result.recordCount;
    }
  }

  return NextResponse.json({
    success: succeeded > 0,
    recordCount: totalRecords,
    total: integrations.length,
    succeeded,
  });
}
