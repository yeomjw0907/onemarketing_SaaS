/**
 * GET  /api/payments/confirm  — Toss Payments 결제 성공 후 리다이렉트 처리
 * POST /api/payments/confirm  — 서버사이드 결제 승인 (내부 호출용)
 *
 * Toss successUrl 흐름:
 *   결제창 → /api/payments/confirm?paymentKey=...&orderId=...&amount=...&agencyId=...&planKey=...&billingCycle=...
 *   → 결제 승인 → /admin/billing?success=1
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmPayment, issueBillingKey } from "@/lib/payments/toss";

/** Toss 리다이렉트 GET 핸들러 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amountStr = searchParams.get("amount");
  const agencyId = searchParams.get("agencyId");
  const planKey = searchParams.get("planKey") ?? "starter";
  const billingCycle = (searchParams.get("billingCycle") ?? "monthly") as "monthly" | "yearly";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://onemarketing.kr";

  if (!paymentKey || !orderId || !amountStr || !agencyId) {
    return NextResponse.redirect(`${appUrl}/admin/billing?paymentFailed=1`);
  }

  const amount = Number(amountStr);
  if (isNaN(amount)) {
    return NextResponse.redirect(`${appUrl}/admin/billing?paymentFailed=1`);
  }

  try {
    const supabase = await createClient();

    // 결제 승인
    await confirmPayment(paymentKey, orderId, amount);

    // 구독 활성화
    const periodEnd = billingCycle === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await supabase
      .from("agency_subscriptions")
      .upsert({
        agency_id: agencyId,
        plan_key: planKey,
        status: "active",
        billing_cycle: billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_ends_at: null,
      }, { onConflict: "agency_id" });

    return NextResponse.redirect(`${appUrl}/admin/billing?success=1`);
  } catch (err) {
    console.error("[payments/confirm GET]", err);
    return NextResponse.redirect(`${appUrl}/admin/billing?paymentFailed=1`);
  }
}

/** 서버사이드 POST 핸들러 (내부/직접 호출용) */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { paymentKey, orderId, amount, authKey, customerKey, agencyId, planKey, billingCycle } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    // 1. Toss 결제 승인
    await confirmPayment(paymentKey, orderId, amount);

    // 2. 빌링키 발급 (자동결제용)
    let billingKey: string | null = null;
    if (authKey && customerKey) {
      const billing = await issueBillingKey(authKey, customerKey);
      billingKey = billing.billingKey;
    }

    // 3. 구독 활성화
    const periodEnd = billingCycle === "yearly"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { error: subError } = await supabase
      .from("agency_subscriptions")
      .upsert({
        agency_id: agencyId,
        plan_key: planKey,
        status: "active",
        billing_cycle: billingCycle ?? "monthly",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_ends_at: null,
        toss_customer_key: customerKey ?? null,
        toss_billing_key: billingKey,
      }, { onConflict: "agency_id" });

    if (subError) {
      console.error("[payments/confirm] subscription upsert error:", subError);
      return NextResponse.json({ error: "구독 활성화 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.";
    console.error("[payments/confirm]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
