/**
 * Instagram daily stats 조회
 * GET /api/instagram/[accountId]/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

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

  // 클라이언트는 자신의 계정만 조회 가능
  if (
    session.profile.role === "client" &&
    session.profile.client_id !== account.client_id
  ) {
    return NextResponse.json({ error: "접근 권한 없음" }, { status: 403 });
  }

  // daily stats 조회
  let statsQuery = supabase
    .from("instagram_daily_stats")
    .select("*")
    .eq("account_id", accountId)
    .order("stat_date", { ascending: true });

  if (from) statsQuery = statsQuery.gte("stat_date", from);
  if (to) statsQuery = statsQuery.lte("stat_date", to);

  const { data: stats, error: statsErr } = await statsQuery;
  if (statsErr) {
    return NextResponse.json({ error: statsErr.message }, { status: 500 });
  }

  // boosting periods 조회
  const { data: boostingPeriods } = await supabase
    .from("boosting_periods")
    .select("*")
    .eq("client_id", account.client_id)
    .order("start_date", { ascending: true });

  return NextResponse.json({ stats: stats ?? [], boostingPeriods: boostingPeriods ?? [] });
}
