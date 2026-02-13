/**
 * 연동 관리 CRUD API
 * GET  — 클라이언트의 모든 연동 조회
 * POST — 새 연동 추가
 * PUT  — 연동 수정
 * DELETE — 연동 삭제
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId 필수" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("data_integrations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, platform, displayName, credentials, config } = body;

  if (!clientId || !platform || !displayName) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 현재 관리자 user_id 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  const createdBy = user?.id || "system";

  const { data, error } = await supabase
    .from("data_integrations")
    .insert({
      client_id: clientId,
      platform,
      display_name: displayName,
      credentials: credentials || {},
      config: config || {},
      status: "inactive",
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, displayName, credentials, config, status } = body;

  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const updatePayload: Record<string, unknown> = {};
  if (displayName !== undefined) updatePayload.display_name = displayName;
  if (credentials !== undefined) updatePayload.credentials = credentials;
  if (config !== undefined) updatePayload.config = config;
  if (status !== undefined) updatePayload.status = status;

  const { data, error } = await supabase
    .from("data_integrations")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 관련 platform_metrics 삭제
  await supabase.from("platform_metrics").delete().eq("integration_id", id);
  // 관련 sync_logs 삭제
  await supabase.from("integration_sync_logs").delete().eq("integration_id", id);
  // 연동 삭제
  const { error } = await supabase.from("data_integrations").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
