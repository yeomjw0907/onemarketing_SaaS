/**
 * POST /api/agency/invite-client/consume
 * 초대 토큰 소비 (사용 완료 표시)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "토큰 누락" }, { status: 400 });

    const supabase = await createClient();

    await supabase
      .from("client_invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)
      .is("used_at", null);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[invite consume]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
