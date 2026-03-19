/**
 * Instagram media metrics 조회
 * GET /api/instagram/[accountId]/media?limit=20&cursor=...
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ accountId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { accountId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  const supabase = await createClient();

  // 계정 조회 및 권한 확인
  const { data: account, error: accErr } = await supabase
    .from("instagram_accounts")
    .select("id, client_id")
    .eq("id", accountId)
    .single();

  if (accErr || !account) {
    return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
  }

  if (
    session.profile.role === "client" &&
    session.profile.client_id !== account.client_id
  ) {
    return NextResponse.json({ error: "접근 권한 없음" }, { status: 403 });
  }

  const { data: media, error: mediaErr } = await supabase
    .from("instagram_media_metrics")
    .select("*")
    .eq("account_id", accountId)
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (mediaErr) {
    return NextResponse.json({ error: mediaErr.message }, { status: 500 });
  }

  return NextResponse.json({ media: media ?? [] });
}
