import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_PASSWORD = "Admin123!";

/**
 * POST /api/admin/clients
 * 클라이언트 + Supabase Auth 유저 + Profile 을 한 번에 생성
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      name,
      client_code,
      contact_name,
      contact_phone,
      contact_email,
    } = body as {
      name: string;
      client_code: string;
      contact_name?: string;
      contact_phone?: string;
      contact_email?: string;
    };

    if (!name || !client_code) {
      return NextResponse.json({ error: "회사명과 클라이언트 코드는 필수입니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceClient = await createServiceClient();

    // 1) clients 테이블에 행 생성
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({
        name,
        client_code: client_code.toLowerCase(),
        contact_name: contact_name || null,
        contact_phone: contact_phone || null,
        contact_email: contact_email || null,
        is_active: true,
      })
      .select()
      .single();

    if (clientErr) {
      const msg = clientErr.message.includes("duplicate")
        ? "이미 사용 중인 클라이언트 코드입니다."
        : clientErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 2) Supabase Auth 유저 생성 (service role 필요)
    const loginEmail = `${client_code.toLowerCase()}@onecation.co.kr`;
    const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
      email: loginEmail,
      password: DEFAULT_PASSWORD,
      email_confirm: true, // 이메일 인증 건너뜀
    });

    if (authErr) {
      // 유저 생성 실패 시 클라이언트도 롤백
      await supabase.from("clients").delete().eq("id", client.id);
      return NextResponse.json({ error: `유저 생성 실패: ${authErr.message}` }, { status: 400 });
    }

    // 3) profiles 테이블에 행 생성
    const { error: profileErr } = await serviceClient
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        role: "client",
        client_id: client.id,
        display_name: contact_name || name,
        email: loginEmail,
        must_change_password: true,
      });

    if (profileErr) {
      // 프로필 생성 실패 — 유저, 클라이언트 롤백
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      await supabase.from("clients").delete().eq("id", client.id);
      return NextResponse.json({ error: `프로필 생성 실패: ${profileErr.message}` }, { status: 400 });
    }

    return NextResponse.json({
      client,
      loginEmail,
      message: `클라이언트 "${name}" 생성 완료. 로그인: ${loginEmail} / 초기 비밀번호: ${DEFAULT_PASSWORD}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "서버 오류" }, { status: 500 });
  }
}
