import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/reset-password
 * 관리자가 특정 유저의 비밀번호를 리셋
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "userId와 newPassword가 필요합니다." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { error } = await serviceClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // must_change_password 플래그 설정
    await serviceClient
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", userId);

    return NextResponse.json({ message: "비밀번호가 리셋되었습니다." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "서버 오류" }, { status: 500 });
  }
}
