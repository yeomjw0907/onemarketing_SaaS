/**
 * GET /api/admin/clients/[id]/members
 * 특정 클라이언트에 접근 가능한 포털 유저 목록 + 대기 중인 초대
 *
 * DELETE — Body: { userId } 클라이언트 멤버 제거
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const supabase = await createClient();

    // 해당 클라이언트에 속한 포털 유저 목록
    const { data: members, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, created_at")
      .eq("client_id", clientId)
      .eq("role", "client")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 대기 중인 초대 토큰 조회
    const { data: pendingInvites } = await supabase
      .from("client_invite_tokens")
      .select("id, invited_email, created_at, expires_at")
      .eq("client_id", clientId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    return NextResponse.json({
      members: members ?? [],
      pendingInvites: pendingInvites ?? [],
    });
  } catch (err) {
    console.error("[admin/clients/members GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId 필수" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // 해당 유저가 이 클라이언트의 멤버인지 확인
    const { data: targetProfile } = await serviceSupabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .eq("role", "client")
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });
    }

    const { error } = await serviceSupabase
      .from("profiles")
      .update({ client_id: null })
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/clients/members DELETE]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
