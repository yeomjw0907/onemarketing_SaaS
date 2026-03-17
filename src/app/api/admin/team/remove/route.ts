/**
 * DELETE /api/admin/team/remove
 * Body: { userId: string }
 * 대행사 팀원 제거 (owner만 가능)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId 필수" }, { status: 400 });
    }

    // 현재 유저 정보
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, agency_role")
      .eq("user_id", session.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: "에이전시 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    if (profile.agency_role !== "owner") {
      return NextResponse.json({ error: "오너만 팀원을 제거할 수 있습니다." }, { status: 403 });
    }
    if (userId === session.id) {
      return NextResponse.json({ error: "자신을 제거할 수 없습니다." }, { status: 400 });
    }

    // 대상 유저가 같은 에이전시인지 확인
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("user_id, agency_role")
      .eq("user_id", userId)
      .eq("agency_id", profile.agency_id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: "팀원을 찾을 수 없습니다." }, { status: 404 });
    }
    if (targetProfile.agency_role === "owner") {
      return NextResponse.json({ error: "오너는 제거할 수 없습니다." }, { status: 400 });
    }

    // agency_id 제거 (profiles에서 분리)
    const serviceSupabase = await createServiceClient();
    const { error } = await serviceSupabase
      .from("profiles")
      .update({ agency_id: null, agency_role: null })
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/team/remove DELETE]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
