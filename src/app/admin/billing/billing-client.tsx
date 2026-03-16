"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CreditCard, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  agency: Record<string, string> | null;
  subscription: Record<string, string> | null;
  plan: Record<string, unknown> | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trialing: { label: "무료 체험 중", variant: "secondary" },
  active:   { label: "구독 중", variant: "default" },
  past_due: { label: "결제 실패", variant: "destructive" },
  cancelled:{ label: "취소됨", variant: "outline" },
  expired:  { label: "만료됨", variant: "destructive" },
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 99000, yearly: 79000 * 12, name: "스타터" },
  pro:     { monthly: 199000, yearly: 159000 * 12, name: "프로" },
  agency:  { monthly: 399000, yearly: 319000 * 12, name: "에이전시" },
};

export default function BillingClient({ agency, subscription, plan }: Props) {
  const [payLoading, setPayLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("결제가 완료되었습니다. 구독이 활성화되었습니다.");
    } else if (searchParams.get("paymentFailed") === "1") {
      toast.error("결제에 실패했습니다. 다시 시도해 주세요.");
    } else if (searchParams.get("expired") === "1") {
      toast.error("구독이 만료되어 서비스 이용이 제한됩니다. 결제를 완료해 주세요.");
    }
  }, [searchParams]);

  const status = subscription?.status ?? "trialing";
  const statusInfo = STATUS_MAP[status] ?? { label: status, variant: "outline" as const };
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const isExpired = status === "expired" || status === "cancelled";
  const isTrialing = status === "trialing";
  const planKey = (subscription?.plan_key ?? "starter") as string;
  const planPrice = PLAN_PRICES[planKey];

  const handlePayment = async () => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      toast.error("결제 설정이 완료되지 않았습니다. (NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정)");
      return;
    }
    if (!agency?.id) {
      toast.error("에이전시 정보를 찾을 수 없습니다.");
      return;
    }

    setPayLoading(true);
    try {
      // Toss Payments SDK 동적 로드
      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const toss = await loadTossPayments(clientKey);

      const amount = billingCycle === "yearly"
        ? (planPrice?.yearly ?? 99000 * 12)
        : (planPrice?.monthly ?? 99000);

      const orderId = `agency_${agency.id}_${Date.now()}`;
      const orderName = `ONEmarketing ${planPrice?.name ?? planKey} (${billingCycle === "yearly" ? "연간" : "월간"})`;

      await toss.requestPayment("카드", {
        amount,
        orderId,
        orderName,
        customerName: agency.name,
        successUrl: `${window.location.origin}/api/payments/confirm?agencyId=${agency.id}&planKey=${planKey}&billingCycle=${billingCycle}`,
        failUrl: `${window.location.origin}/admin/billing?paymentFailed=1`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "결제 중 오류가 발생했습니다.";
      if (!msg.includes("취소")) toast.error(msg);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">구독 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">플랜 및 결제 정보를 관리하세요.</p>
      </div>

      {/* 만료 경고 */}
      {isExpired && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">구독이 만료되었습니다.</p>
            <p className="text-destructive/80 mt-0.5">결제를 완료하면 즉시 서비스를 다시 이용할 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* 체험 종료 임박 안내 */}
      {isTrialing && periodEnd && (periodEnd.getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
          <Clock className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">무료 체험이 곧 종료됩니다.</p>
            <p className="mt-0.5 opacity-80">체험 종료 전 결제를 완료하면 서비스가 중단 없이 유지됩니다.</p>
          </div>
        </div>
      )}

      {/* 현재 플랜 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">현재 플랜</CardTitle>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">플랜</p>
              <p className="font-medium mt-0.5">{(plan?.name as string) ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">클라이언트 한도</p>
              <p className="font-medium mt-0.5">
                {(plan?.max_clients as number | null) ? `최대 ${plan?.max_clients}개` : "무제한"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {isTrialing ? "체험 종료일" : isExpired ? "만료일" : "다음 결제일"}
              </p>
              <p className="font-medium mt-0.5 flex items-center gap-1.5">
                {isTrialing && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                {isExpired && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                {!isExpired && !isTrialing && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                {periodEnd ? format(periodEnd, "yyyy년 M월 d일", { locale: ko }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">결제 방식</p>
              <p className="font-medium mt-0.5">
                {subscription?.billing_cycle === "yearly" ? "연간 결제" : "월간 결제"}
              </p>
            </div>
          </div>

          {/* 결제 섹션 */}
          {(isExpired || isTrialing) && planPrice && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">결제 방식 선택</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 rounded-lg border p-3 text-sm text-left transition-all ${
                    billingCycle === "monthly" ? "border-primary bg-primary/5" : "hover:border-border/80"
                  }`}
                >
                  <p className="font-medium">월간 결제</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{planPrice.monthly.toLocaleString()}원/월</p>
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex-1 rounded-lg border p-3 text-sm text-left transition-all ${
                    billingCycle === "yearly" ? "border-primary bg-primary/5" : "hover:border-border/80"
                  }`}
                >
                  <p className="font-medium">연간 결제 <span className="text-xs text-green-600 ml-1">20% 절약</span></p>
                  <p className="text-muted-foreground text-xs mt-0.5">{planPrice.yearly.toLocaleString()}원/년</p>
                </button>
              </div>
              <Button className="w-full" size="lg" onClick={handlePayment} disabled={payLoading}>
                {payLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />결제창 열는 중...</>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {billingCycle === "yearly"
                      ? `${planPrice.yearly.toLocaleString()}원 결제하기 (연간)`
                      : `${planPrice.monthly.toLocaleString()}원 결제하기 (월간)`}
                  </>
                )}
              </Button>
            </div>
          )}

          {!isExpired && !isTrialing && (
            <div className="flex gap-3 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => window.location.href = "/onboarding/plan"}>
                플랜 변경
              </Button>
              <Button variant="outline" className="flex-1" onClick={handlePayment} disabled={payLoading}>
                {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "결제 수단 변경"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 에이전시 정보 */}
      {agency && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">에이전시 정보</CardTitle>
            <CardDescription>청구서에 표시되는 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex gap-4">
              <span className="text-muted-foreground w-20 shrink-0">에이전시명</span>
              <span className="font-medium">{agency.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground text-center">
        플랜 비교가 필요하신가요?{" "}
        <a href="/#pricing" className="text-primary hover:underline">가격 안내 보기</a>
      </p>
    </div>
  );
}
