/**
 * POST /api/admin/kpis/auto-generate
 * 플랫폼 연동 추가 시 KPI 프리셋 자동 생성
 * 이미 존재하는 metric_key는 건너뜀 (중복 방지)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_KPI_TEMPLATES } from "@/lib/kpi-templates";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = await createClient();

  const { clientId, platform } = await req.json();
  if (!clientId || !platform) {
    return NextResponse.json({ error: "clientId, platform 필수" }, { status: 400 });
  }

  const templates = PLATFORM_KPI_TEMPLATES[platform];
  if (!templates || templates.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0, message: "해당 플랫폼의 KPI 템플릿 없음" });
  }

  // 기존 KPI 키 목록 조회
  const { data: existing } = await supabase
    .from("kpi_definitions")
    .select("metric_key")
    .eq("client_id", clientId);

  const existingKeys = new Set((existing || []).map((k: { metric_key: string }) => k.metric_key));

  // 현재 최대 overview_order 조회
  const { data: orderData } = await supabase
    .from("kpi_definitions")
    .select("overview_order")
    .eq("client_id", clientId)
    .order("overview_order", { ascending: false })
    .limit(1);

  let nextOrder = ((orderData?.[0]?.overview_order as number) ?? 0) + 1;

  const toInsert = templates
    .filter(t => !existingKeys.has(t.metric_key))
    .map(t => ({
      client_id: clientId,
      metric_key: t.metric_key,
      metric_label: t.metric_label,
      unit: t.unit,
      format: t.format,
      higher_is_better: t.higher_is_better,
      show_on_overview: t.show_on_overview,
      overview_order: t.show_on_overview ? nextOrder++ : 0,
      chart_enabled: t.chart_enabled,
      description: null,
      validation_rule: { required: false },
      computation: t.computation,
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0, skipped: templates.length, message: "모두 이미 존재" });
  }

  const { error } = await supabase.from("kpi_definitions").insert(toInsert);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    created: toInsert.length,
    skipped: templates.length - toInsert.length,
    message: `KPI ${toInsert.length}개 생성 완료`,
  });
}
