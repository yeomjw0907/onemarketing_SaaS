/**
 * POST /api/admin/clients/[id]/invite
 * 어드민이 특정 클라이언트에게 포털 초대 링크 생성
 * (에이전시 없이도 사용 가능)
 *
 * Body: { invitedEmail: string, sendAlimtalk?: boolean }
 * - sendAlimtalk: true이면 클라이언트 contact_phone으로 초대 링크 알림톡 발송
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyClientInvite } from "@/lib/notifications/alimtalk";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const supabase = await createClient();

    const { invitedEmail, sendAlimtalk: doSendAlimtalk } = await req.json();
    if (!invitedEmail?.trim()) {
      return NextResponse.json({ error: "이메일을 입력해 주세요." }, { status: 400 });
    }

    // 클라이언트 존재 확인 (알림톡용 전화번호 포함)
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, agency_id, contact_phone")
      .eq("id", clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "클라이언트를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    // 초대 토큰 생성 (agency_id는 optional)
    const { data: inviteToken, error: tokenError } = await supabase
      .from("client_invite_tokens")
      .insert({
        agency_id: client.agency_id ?? null,
        client_id: clientId,
        invited_email: invitedEmail.trim().toLowerCase(),
        invited_by: user!.id,
      })
      .select("token")
      .single();

    if (tokenError || !inviteToken) {
      return NextResponse.json({ error: "초대 토큰 생성 실패: " + tokenError?.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onemarketing.kr";
    const inviteUrl = `${appUrl}/invite/${inviteToken.token}`;

    // 알림톡 발송 (요청 시 + 전화번호 있을 때)
    let alimtalkResult: { success: boolean; error?: string } | null = null;
    if (doSendAlimtalk && client.contact_phone) {
      try {
        alimtalkResult = await notifyClientInvite({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          inviteUrl,
        });
      } catch {
        alimtalkResult = { success: false, error: "알림톡 발송 중 오류" };
      }
    }

    return NextResponse.json({
      success: true,
      inviteUrl,
      alimtalk: alimtalkResult,
    });
  } catch (err) {
    console.error("[admin/clients/invite]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
