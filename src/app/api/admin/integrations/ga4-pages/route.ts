/**
 * 어드민: GA4 추적 랜딩페이지 URL 설정 API
 * GET  /api/admin/integrations/ga4-pages?clientId=xxx
 * POST /api/admin/integrations/ga4-pages { clientId, paths: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId 파라미터가 필요합니다." }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: integration, error } = await supabase
    .from("data_integrations")
    .select("id, credentials")
    .eq("client_id", clientId)
    .eq("platform", "google_analytics")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!integration) {
    return NextResponse.json({ data: { integrationId: null, targetPaths: [] } });
  }

  const creds = (integration.credentials as Record<string, unknown>) ?? {};
  const targetPaths = (creds.target_paths as string[]) || [];

  return NextResponse.json({ data: { integrationId: integration.id, targetPaths } });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.clientId || !Array.isArray(body.paths)) {
    return NextResponse.json({ error: "clientId 와 paths 배열이 필요합니다." }, { status: 400 });
  }

  const { clientId, paths } = body as { clientId: string; paths: string[] };

  const supabase = await createServiceClient();

  // 해당 클라이언트의 GA4 integration 찾기
  const { data: integration, error: fetchErr } = await supabase
    .from("data_integrations")
    .select("id, credentials")
    .eq("client_id", clientId)
    .eq("platform", "google_analytics")
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!integration) {
    return NextResponse.json({ error: "GA4 연동을 찾을 수 없습니다." }, { status: 404 });
  }

  const existingCreds = (integration.credentials as Record<string, unknown>) ?? {};
  const updatedCreds = { ...existingCreds, target_paths: paths };

  const { error: updateErr } = await supabase
    .from("data_integrations")
    .update({ credentials: updatedCreds })
    .eq("id", integration.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, targetPaths: paths });
}
