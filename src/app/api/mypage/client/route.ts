import { requireClient } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/mypage/client
 * 로그인한 클라이언트가 자신의 담당자 정보(담당자명, 연락처, 담당자 이메일) 수정
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireClient();
    if (!session.client) {
      return NextResponse.json({ error: "클라이언트 정보가 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { contact_name, contact_phone, contact_email } = body as {
      contact_name?: string | null;
      contact_phone?: string | null;
      contact_email?: string | null;
    };

    const serviceClient = await createServiceClient();
    const { error } = await serviceClient
      .from("clients")
      .update({
        contact_name: contact_name ?? undefined,
        contact_phone: contact_phone ?? undefined,
        contact_email: contact_email ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.client.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "저장되었습니다." });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "서버 오류" },
      { status: 500 }
    );
  }
}
