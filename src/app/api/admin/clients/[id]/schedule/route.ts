/**
 * GET  /api/admin/clients/[id]/schedule  — 클라이언트 스케줄 목록 조회
 * POST /api/admin/clients/[id]/schedule  — 스케줄 추가/수정 (upsert, 최대 3개)
 * DELETE /api/admin/clients/[id]/schedule — 스케줄 삭제 (body: { day_of_week })
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("client_report_schedules")
      .select("*")
      .eq("client_id", clientId)
      .order("day_of_week", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedules: data ?? [] });
  } catch (err) {
    console.error("[admin/clients/schedule GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const body = await req.json();
    const { day_of_week, template_type, is_active = true } = body as {
      day_of_week: number;
      template_type: string;
      is_active?: boolean;
    };

    if (day_of_week === undefined || day_of_week === null) {
      return NextResponse.json({ error: "day_of_week 필수" }, { status: 400 });
    }
    if (!template_type) {
      return NextResponse.json({ error: "template_type 필수" }, { status: 400 });
    }
    if (!["PERFORMANCE", "BUDGET", "PROPOSAL"].includes(template_type)) {
      return NextResponse.json(
        { error: "template_type은 PERFORMANCE, BUDGET, PROPOSAL 중 하나여야 합니다." },
        { status: 400 }
      );
    }
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: "day_of_week는 0~6 사이여야 합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 최대 주 3회 제한: is_active=true인 스케줄이 이미 3개 이상이면 거부
    // (단, 동일 day_of_week upsert는 허용 — 기존 행 업데이트이므로 카운트 제외)
    const { data: existing, error: countErr } = await supabase
      .from("client_report_schedules")
      .select("id, day_of_week")
      .eq("client_id", clientId)
      .eq("is_active", true);

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }

    const alreadyExists = (existing ?? []).some(
      (s) => s.day_of_week === day_of_week
    );

    if (!alreadyExists && (existing ?? []).length >= 3) {
      return NextResponse.json(
        { error: "스케줄은 최대 주 3회까지만 등록할 수 있습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("client_report_schedules")
      .upsert(
        {
          client_id: clientId,
          day_of_week,
          template_type,
          is_active,
        },
        { onConflict: "client_id,day_of_week" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ schedule: data });
  } catch (err) {
    console.error("[admin/clients/schedule POST]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const body = await req.json();
    const { day_of_week } = body as { day_of_week: number };

    if (day_of_week === undefined || day_of_week === null) {
      return NextResponse.json({ error: "day_of_week 필수" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("client_report_schedules")
      .delete()
      .eq("client_id", clientId)
      .eq("day_of_week", day_of_week);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/clients/schedule DELETE]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
