/**
 * POST /api/agency/invite-client
 * 에이전시가 클라이언트에게 초대 이메일 발송
 * - 클라이언트 레코드 생성
 * - 초대 토큰 생성
 * - Supabase Auth 이메일 초대 발송
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 에이전시 오너 또는 admin만 허용
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id")
      .eq("user_id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && !profile.agency_id)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();
    const { clientName, invitedEmail, agencyId } = body;

    const targetAgencyId = profile.role === "admin" ? agencyId : profile.agency_id;
    if (!targetAgencyId) {
      return NextResponse.json({ error: "에이전시 정보가 없습니다." }, { status: 400 });
    }
    if (!clientName?.trim()) {
      return NextResponse.json({ error: "클라이언트 이름을 입력해 주세요." }, { status: 400 });
    }
    if (!invitedEmail?.trim()) {
      return NextResponse.json({ error: "초대할 이메일을 입력해 주세요." }, { status: 400 });
    }

    // 플랜 클라이언트 수 제한 확인 (trialing 제외)
    const { data: subscription } = await supabase
      .from("agency_subscriptions")
      .select("plan_key, status")
      .eq("agency_id", targetAgencyId)
      .single();

    if (subscription && subscription.status !== "trialing") {
      const { data: planData } = await supabase
        .from("subscription_plans")
        .select("max_clients")
        .eq("plan_key", subscription.plan_key)
        .single();

      if (planData?.max_clients != null) {
        const { count: currentCount } = await supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", targetAgencyId);

        if ((currentCount ?? 0) >= planData.max_clients) {
          return NextResponse.json({
            error: `현재 플랜의 클라이언트 최대 수(${planData.max_clients}개)에 도달했습니다. 플랜을 업그레이드해 주세요.`,
          }, { status: 400 });
        }
      }
    }

    // 1. 클라이언트 레코드 생성
    const clientCode = generateClientCode(clientName);
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: clientName.trim(),
        client_code: clientCode,
        agency_id: targetAgencyId,
        is_active: true,
      })
      .select("id")
      .single();

    if (clientError || !client) {
      console.error("[invite-client] client insert error:", clientError);
      return NextResponse.json({ error: "클라이언트 생성 실패: " + (clientError?.message ?? "") }, { status: 500 });
    }

    // 2. 초대 토큰 생성
    const { data: inviteToken, error: tokenError } = await supabase
      .from("client_invite_tokens")
      .insert({
        agency_id: targetAgencyId,
        client_id: client.id,
        invited_email: invitedEmail.trim().toLowerCase(),
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (tokenError || !inviteToken) {
      console.error("[invite-client] token insert error:", tokenError);
      return NextResponse.json({ error: "초대 토큰 생성 실패" }, { status: 500 });
    }

    // 3. 초대 링크 생성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://onemarketing.kr";
    const inviteUrl = `${appUrl}/invite/${inviteToken.token}`;

    // 4. Supabase Auth 이메일 초대 (관리자 키 필요)
    // 실제 운영에서는 SUPABASE_SERVICE_ROLE_KEY로 inviteUserByEmail 호출
    // 여기서는 초대 링크를 응답으로 반환 (이메일 발송은 별도 구현)
    // TODO: Supabase service role로 inviteUserByEmail 호출 추가

    return NextResponse.json({
      success: true,
      clientId: client.id,
      inviteUrl,
      message: `${invitedEmail}에게 초대 링크가 생성되었습니다.`,
    });
  } catch (err) {
    console.error("[invite-client]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

/** 클라이언트 이름 → 유니크 코드 생성 */
function generateClientCode(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "")
    .slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
