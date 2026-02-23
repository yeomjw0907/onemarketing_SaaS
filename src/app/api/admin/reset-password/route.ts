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
      // Supabase 약한 비밀번호 검사(유출 비밀번호 등) 시 안내 메시지로 대체
      const isWeakPassword =
        error.message?.toLowerCase().includes("weak") ||
        error.message?.toLowerCase().includes("easy to guess");
      const message = isWeakPassword
        ? "Supabase 보안 정책에서 이 비밀번호를 허용하지 않습니다. Supabase 대시보드 → Authentication → Email 설정에서 '유출된 비밀번호 사용 방지'를 해제하거나, 더 복잡한 비밀번호를 사용해 주세요."
        : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ message: "비밀번호가 리셋되었습니다." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "서버 오류" }, { status: 500 });
  }
}
