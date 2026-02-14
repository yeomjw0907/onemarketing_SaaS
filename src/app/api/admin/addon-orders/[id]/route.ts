import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { AddonOrderStatus } from "@/lib/types/database";

const VALID_STATUSES: AddonOrderStatus[] = ["pending", "confirmed", "done", "cancelled"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.profile.role !== "admin") {
    return NextResponse.json({ error: "관리자만 수정할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "주문 ID가 필요합니다." }, { status: 400 });
  }

  let body: { status?: string; admin_notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const updates: { status?: AddonOrderStatus; admin_notes?: string | null } = {};
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as AddonOrderStatus)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 });
    }
    updates.status = body.status as AddonOrderStatus;
  }
  if (body.admin_notes !== undefined) {
    updates.admin_notes = typeof body.admin_notes === "string" ? body.admin_notes.trim() || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("addon_orders")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
