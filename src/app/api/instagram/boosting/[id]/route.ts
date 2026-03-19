/**
 * 부스팅 기간 수정/삭제 (어드민 전용)
 * PATCH  /api/instagram/boosting/[id]
 * DELETE /api/instagram/boosting/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") {
    return NextResponse.json({ error: "어드민 권한 필요" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const allowedFields = ["label", "start_date", "end_date", "budget_won", "meta_campaign_id", "account_id"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("boosting_periods")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boostingPeriod: data });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") {
    return NextResponse.json({ error: "어드민 권한 필요" }, { status: 403 });
  }

  const { id } = await params;
  const svc = await createServiceClient();

  const { error } = await svc.from("boosting_periods").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
