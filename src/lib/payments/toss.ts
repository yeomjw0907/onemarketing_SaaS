/**
 * Toss Payments 연동 모듈
 * 구독 결제 (정기결제 빌링키 방식)
 *
 * 환경변수:
 * - TOSS_SECRET_KEY: 토스페이먼츠 시크릿 키 (test_sk_... 또는 live_sk_...)
 * - NEXT_PUBLIC_TOSS_CLIENT_KEY: 토스페이먼츠 클라이언트 키 (test_ck_... 또는 live_ck_...)
 */

const TOSS_API_URL = "https://api.tosspayments.com/v1";

function getTossAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.");
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

/** 빌링키 발급 (최초 카드 등록 시 사용) */
export async function issueBillingKey(authKey: string, customerKey: string) {
  const res = await fetch(`${TOSS_API_URL}/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new TossPaymentError(data.code, data.message);
  }
  return data as TossBillingKeyResponse;
}

/** 빌링키로 자동결제 요청 */
export async function chargeBillingKey({
  billingKey,
  customerKey,
  amount,
  orderId,
  orderName,
  customerEmail,
  customerName,
}: ChargeBillingParams) {
  const res = await fetch(`${TOSS_API_URL}/billing/${billingKey}`, {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
      customerEmail,
      customerName,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new TossPaymentError(data.code, data.message);
  }
  return data as TossPaymentResponse;
}

/** 결제 승인 (카드 일반결제 / 체험 후 첫 결제) */
export async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
  const res = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new TossPaymentError(data.code, data.message);
  }
  return data as TossPaymentResponse;
}

/** 결제 취소 */
export async function cancelPayment(paymentKey: string, cancelReason: string) {
  const res = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: getTossAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cancelReason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new TossPaymentError(data.code, data.message);
  }
  return data;
}

/** 월 구독 금액 계산 */
export function getSubscriptionAmount(planKey: string, billingCycle: "monthly" | "yearly"): number {
  const prices: Record<string, { monthly: number; yearly: number }> = {
    starter: { monthly: 99000, yearly: 79000 },
    pro:     { monthly: 199000, yearly: 159000 },
    agency:  { monthly: 399000, yearly: 319000 },
  };

  const plan = prices[planKey];
  if (!plan) throw new Error(`알 수 없는 플랜: ${planKey}`);

  return billingCycle === "yearly" ? plan.yearly * 12 : plan.monthly;
}

export class TossPaymentError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "TossPaymentError";
  }
}

// ── 타입 정의 ──────────────────────────────────────────

export interface TossBillingKeyResponse {
  billingKey: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  card?: {
    company: string;
    number: string;
    cardType: string;
    ownerType: string;
  };
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  requestedAt: string;
  approvedAt: string;
  totalAmount: number;
  balanceAmount: number;
  method: string;
  receipt?: { url: string };
}

export interface ChargeBillingParams {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
}
