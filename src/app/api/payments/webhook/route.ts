/**
 * POST /api/payments/webhook
 * Toss Payments 웹훅 수신
 * - DONE: 결제 완료 → 구독 갱신
 * - CANCELED: 결제 취소
 * - PARTIAL_CANCELED: 부분 취소
 *
 * 환경변수: TOSS_WEBHOOK_SECRET (웹훅 시크릿, 선택)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    const supabase = await createClient();

    if (eventType === "PAYMENT_STATUS_CHANGED") {
      const { orderId, status, totalAmount } = data;

      if (status === "DONE") {
        // orderId 형식: agency_{agencyId}_{timestamp}
        const agencyId = extractAgencyId(orderId);
        if (!agencyId) {
          console.warn("[webhook] orderId에서 agencyId 추출 실패:", orderId);
          return NextResponse.json({ ok: true });
        }

        // 구독 기간 연장
        const { data: sub } = await supabase
          .from("agency_subscriptions")
          .select("billing_cycle, current_period_end")
          .eq("agency_id", agencyId)
          .single();

        if (sub) {
          const nextEnd = sub.billing_cycle === "yearly"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await supabase
            .from("agency_subscriptions")
            .update({
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: nextEnd.toISOString(),
            })
            .eq("agency_id", agencyId);
        }
      }

      if (status === "CANCELED") {
        const agencyId = extractAgencyId(orderId);
        if (agencyId) {
          await supabase
            .from("agency_subscriptions")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("agency_id", agencyId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payments/webhook]", err);
    return NextResponse.json({ ok: true }); // 웹훅은 항상 200 반환
  }
}

function extractAgencyId(orderId: string): string | null {
  // 형식: agency_{uuid}_{timestamp}
  const match = orderId.match(/^agency_([0-9a-f-]{36})_/);
  return match ? match[1] : null;
}
