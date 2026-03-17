/**
 * 대행사 팀 멤버 관리 API
 *
 * GET  — 팀 멤버 목록 조회
 * POST — 팀 멤버 초대 (invite token 생성 + 이메일 전송)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();

    // 현재 유저의 agency_id 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("user_id", session.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: "에이전시 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 같은 agency_id를 가진 모든 admin 멤버 조회
    const { data: members, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, agency_role, created_at")
      .eq("agency_id", profile.agency_id)
      .eq("role", "admin")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 대기 중인 초대 토큰 조회
    const { data: pendingInvites } = await supabase
      .from("agency_invite_tokens")
      .select("id, invited_email, invited_role, created_at, expires_at")
      .eq("agency_id", profile.agency_id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    return NextResponse.json({
      members: members ?? [],
      pendingInvites: pendingInvites ?? [],
    });
  } catch (err) {
    console.error("[admin/team GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();

    const { invitedEmail, invitedRole } = await req.json();

    if (!invitedEmail?.trim()) {
      return NextResponse.json({ error: "이메일을 입력해 주세요." }, { status: 400 });
    }
    if (!["manager", "viewer"].includes(invitedRole)) {
      return NextResponse.json({ error: "역할은 manager 또는 viewer여야 합니다." }, { status: 400 });
    }

    // 현재 유저의 agency_id + role 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, agency_role")
      .eq("user_id", session.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: "에이전시 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    if (profile.agency_role !== "owner") {
      return NextResponse.json({ error: "오너만 팀원을 초대할 수 있습니다." }, { status: 403 });
    }

    // 이미 같은 에이전시에 가입된 이메일 확인
    const serviceSupabase = await createServiceClient();
    const { data: existingProfile } = await serviceSupabase
      .from("profiles")
      .select("user_id, email")
      .eq("agency_id", profile.agency_id)
      .eq("email", invitedEmail.trim().toLowerCase())
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: "이미 팀원으로 등록된 이메일입니다." }, { status: 409 });
    }

    // 기존 유효 초대 토큰 확인
    const { data: existingInvite } = await supabase
      .from("agency_invite_tokens")
      .select("id")
      .eq("agency_id", profile.agency_id)
      .eq("invited_email", invitedEmail.trim().toLowerCase())
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: "이미 초대 중인 이메일입니다." }, { status: 409 });
    }

    // 초대 토큰 생성
    const { data: inviteToken, error: tokenError } = await supabase
      .from("agency_invite_tokens")
      .insert({
        agency_id: profile.agency_id,
        invited_email: invitedEmail.trim().toLowerCase(),
        invited_role: invitedRole,
        invited_by: session.id,
      })
      .select("token")
      .single();

    if (tokenError || !inviteToken) {
      return NextResponse.json({ error: "초대 토큰 생성 실패: " + tokenError?.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/agency/${inviteToken.token}`;

    return NextResponse.json({ success: true, inviteUrl });
  } catch (err) {
    console.error("[admin/team POST]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
