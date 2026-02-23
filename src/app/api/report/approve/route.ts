import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: row, error: fetchError } = await supabase
    .from("notifications")
    .select("id, approval_status, approval_used_at, approval_token_expires_at, view_token")
    .eq("approval_token", token)
    .single();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "유효하지 않거나 만료된 링크입니다." },
      { status: 404 }
    );
  }

  const expiresAt = row.approval_token_expires_at
    ? new Date(row.approval_token_expires_at)
    : null;
  if (expiresAt && expiresAt < new Date()) {
    return NextResponse.json(
      { error: "승인 링크가 만료되었습니다." },
      { status: 410 }
    );
  }

  if (row.approval_status === "APPROVED" && row.approval_used_at) {
    return NextResponse.json({
      success: true,
      alreadyApproved: true,
      message: "이미 승인되었습니다.",
      view_token: row.view_token,
    });
  }

  const { error: updateError } = await supabase
    .from("notifications")
    .update({
      approval_status: "APPROVED",
      approval_used_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateError) {
    return NextResponse.json(
      { error: "승인 처리에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "승인되었습니다.",
    view_token: row.view_token,
  });
}
