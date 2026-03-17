/**
 * POST /api/agency/invite-agency/accept
 * 대행사 팀 초대 수락 — serviceRole로 어드민 유저 생성
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, displayName, password, invitedEmail, agencyId, invitedRole } = body as {
      token: string;
      displayName: string;
      password: string;
      invitedEmail: string;
      agencyId: string;
      invitedRole: string;
    };

    if (!token || !displayName?.trim() || !password || !invitedEmail || !agencyId) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상 입력해 주세요." }, { status: 400 });
    }
    if (!["manager", "viewer"].includes(invitedRole)) {
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceClient = await createServiceClient();

    // 토큰 유효성 재확인
    const { data: invite } = await supabase
      .from("agency_invite_tokens")
      .select("id, used_at, expires_at, agency_id, invited_email, invited_role")
      .eq("token", token)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "유효하지 않은 초대 링크입니다." }, { status: 400 });
    }
    if (invite.used_at) {
      return NextResponse.json({ error: "이미 사용된 초대 링크입니다." }, { status: 400 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "만료된 초대 링크입니다." }, { status: 400 });
    }
    if (invite.agency_id !== agencyId || invite.invited_email !== invitedEmail) {
      return NextResponse.json({ error: "초대 정보가 일치하지 않습니다." }, { status: 400 });
    }

    // service role로 유저 생성 (email_confirm: true → 이메일 인증 불필요)
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: invitedEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName.trim() },
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already registered")) {
        return NextResponse.json({ error: "이미 가입된 이메일입니다. 해당 계정으로 로그인해 주세요." }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 어드민 프로필 생성
    const { error: profileError } = await serviceClient.from("profiles").insert({
      user_id: authData.user.id,
      role: "admin",
      agency_id: agencyId,
      agency_role: invite.invited_role ?? invitedRole,
      display_name: displayName.trim(),
      email: invitedEmail,
      must_change_password: false,
    });

    if (profileError) {
      // 프로필 생성 실패 시 유저도 롤백
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "프로필 생성 실패: " + profileError.message }, { status: 500 });
    }

    // 토큰 소비 처리
    await supabase
      .from("agency_invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[invite-agency/accept]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
