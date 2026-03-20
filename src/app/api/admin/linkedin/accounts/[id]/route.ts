/**
 * LinkedIn 연결 계정 삭제 API
 * DELETE /api/admin/linkedin/accounts/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  return profile?.role === "admin";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "어드민 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id 파라미터 누락" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 연결된 integration_id 조회
  const { data: connection } = await supabase
    .from("linkedin_connections")
    .select("integration_id")
    .eq("id", id)
    .single();

  // linkedin_connections 삭제
  const { error: connError } = await supabase
    .from("linkedin_connections")
    .delete()
    .eq("id", id);

  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 500 });
  }

  // 연결된 data_integrations 삭제 (있는 경우)
  if (connection?.integration_id) {
    await supabase
      .from("data_integrations")
      .delete()
      .eq("id", connection.integration_id);
  }

  return NextResponse.json({ success: true });
}
