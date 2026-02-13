/**
 * 성과 지표 자동 반영 API
 * platform_metrics(일별) → 주간/월간 집계 → metrics 테이블 반영
 * 관리자 전용. body: { clientId?, periodType?, dateFrom?, dateTo? }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { aggregatePlatformMetricsToMetrics } from "@/lib/integrations/metrics-aggregator";
import type { PeriodType } from "@/lib/types/database";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  let body: {
    clientId?: string;
    periodType?: PeriodType;
    dateFrom?: string;
    dateTo?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    // body 없으면 기본값으로 진행
  }

  const { clientId, periodType = "weekly", dateFrom: bodyFrom, dateTo: bodyTo } = body;

  const now = new Date();
  const defaultTo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultFrom =
    periodType === "monthly"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const dateFrom = bodyFrom ?? defaultFrom;
  const dateTo = bodyTo ?? defaultTo;

  const supabase = await createServiceClient();
  const result = await aggregatePlatformMetricsToMetrics(supabase, {
    clientId,
    periodType,
    dateFrom,
    dateTo,
  });

  return NextResponse.json({
    success: result.success,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors.length ? result.errors : undefined,
  });
}
