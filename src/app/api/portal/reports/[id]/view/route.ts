/**
 * 리포트 열람 추적 API
 * POST  — 최초 열람 기록 (upsert)
 * PATCH — 체류 시간 업데이트 (heartbeat, 30초마다)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

// ── POST: 열람 시작 ──
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id: reportId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 프로필에서 client_id 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile?.client_id || profile.role === "admin") {
      // 어드민이 보는 경우는 추적 안 함
      return NextResponse.json({ ok: true, tracked: false });
    }

    // 리포트가 이 클라이언트 소유인지 확인
    const { data: report } = await supabase
      .from("reports")
      .select("id, client_id")
      .eq("id", reportId)
      .eq("client_id", profile.client_id)
      .single();

    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // service role로 upsert (viewer_user_id + report_id 기준 — 한 유저당 하나)
    const svc = await createServiceClient();
    const { data: view, error } = await svc
      .from("report_views")
      .upsert(
        {
          report_id: reportId,
          client_id: profile.client_id,
          viewer_user_id: user.id,
          opened_at: new Date().toISOString(),
          duration_seconds: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "report_id,viewer_user_id", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) {
      console.error("report_views upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tracked: true, viewId: view.id });
  } catch (err) {
    console.error("view POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ── PATCH: 체류 시간 업데이트 (heartbeat) ──
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: reportId } = await params;
    const { duration_seconds } = await req.json() as { duration_seconds: number };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = await createServiceClient();
    await svc
      .from("report_views")
      .update({ duration_seconds, updated_at: new Date().toISOString() })
      .eq("report_id", reportId)
      .eq("viewer_user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("view PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
