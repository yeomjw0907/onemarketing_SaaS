/**
 * 부스팅 기간 CRUD
 * GET  /api/instagram/boosting?clientId=...
 * POST /api/instagram/boosting (어드민 전용)
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId 파라미터 필요" }, { status: 400 });
  }

  // 클라이언트는 자신의 데이터만 조회 가능
  if (session.profile.role === "client" && session.profile.client_id !== clientId) {
    return NextResponse.json({ error: "접근 권한 없음" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boosting_periods")
    .select("*")
    .eq("client_id", clientId)
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boostingPeriods: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") {
    return NextResponse.json({ error: "어드민 권한 필요" }, { status: 403 });
  }

  const body = (await req.json()) as {
    clientId: string;
    accountId: string;
    label: string;
    startDate: string;
    endDate: string;
    budgetWon?: number;
    metaCampaignId?: string;
  };

  const { clientId, accountId, label, startDate, endDate, budgetWon, metaCampaignId } = body;

  if (!clientId || !label || !startDate || !endDate) {
    return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
  }

  const svc = await createServiceClient();
  const { data, error } = await svc
    .from("boosting_periods")
    .insert({
      client_id: clientId,
      account_id: accountId || null,
      label,
      start_date: startDate,
      end_date: endDate,
      budget_won: budgetWon ?? null,
      meta_campaign_id: metaCampaignId ?? null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ boostingPeriod: data }, { status: 201 });
}
