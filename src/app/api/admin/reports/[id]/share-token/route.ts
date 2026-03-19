/**
 * POST /api/admin/reports/[id]/share-token
 * 리포트 공유 링크(view_token) 생성/갱신
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: reportId } = await params;
    const supabase = await createClient();

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일

    const { error } = await supabase
      .from("reports")
      .update({
        view_token: token,
        view_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://onemarketing.kr";
    return NextResponse.json({ shareUrl: `${appUrl}/report/v/${token}` });
  } catch (err) {
    console.error("[admin/reports/share-token]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
