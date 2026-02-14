import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/mypage/profile
 * 로그인한 클라이언트가 본인 담당자명·전화번호·이메일 수정
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireClient();
    const body = await request.json();
    const {
      display_name,
      email,
      contact_name,
      contact_phone,
      contact_email,
    } = body as {
      display_name?: string;
      email?: string;
      contact_name?: string;
      contact_phone?: string;
      contact_email?: string;
    };

    const supabase = await createClient();

    // profiles: display_name, email
    const profileUpdates: { display_name?: string; email?: string } = {};
    if (display_name !== undefined) profileUpdates.display_name = display_name.trim() || "";
    if (email !== undefined) profileUpdates.email = email.trim() || "";

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("user_id", session.id);

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 400 });
      }
    }

    // clients: contact_name, contact_phone, contact_email (본인 소속 클라이언트만)
    if (session.client?.id) {
      const clientUpdates: {
        contact_name?: string | null;
        contact_phone?: string | null;
        contact_email?: string | null;
      } = {};
      if (contact_name !== undefined) clientUpdates.contact_name = contact_name?.trim() || null;
      if (contact_phone !== undefined) clientUpdates.contact_phone = contact_phone?.trim() || null;
      if (contact_email !== undefined) clientUpdates.contact_email = contact_email?.trim() || null;

      if (Object.keys(clientUpdates).length > 0) {
        const { error: clientErr } = await supabase
          .from("clients")
          .update(clientUpdates)
          .eq("id", session.client.id);

        if (clientErr) {
          return NextResponse.json({ error: clientErr.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ message: "저장되었습니다." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
