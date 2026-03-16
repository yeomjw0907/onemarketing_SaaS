"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    key: "starter",
    name: "스타터",
    monthlyPrice: 99000,
    yearlyPrice: 79000,
    maxClients: "최대 5개",
    features: [
      "클라이언트 포털 5개",
      "모든 기본 모듈 (대시보드, 실행, 캘린더, 리포트, 에셋)",
      "카카오 알림톡 100건/월",
      "주간·월간 리포트",
      "브랜드 에셋 자료실",
    ],
    badge: null,
  },
  {
    key: "pro",
    name: "프로",
    monthlyPrice: 199000,
    yearlyPrice: 159000,
    maxClients: "최대 20개",
    features: [
      "클라이언트 포털 20개",
      "스타터 모든 기능",
      "카카오 알림톡 500건/월",
      "플랫폼 연동 (GA4·Meta·Google Ads·Naver)",
      "AI 리포트 자동 생성",
      "부가 서비스 스토어",
    ],
    badge: "인기",
  },
  {
    key: "agency",
    name: "에이전시",
    monthlyPrice: 399000,
    yearlyPrice: 319000,
    maxClients: "무제한",
    features: [
      "클라이언트 포털 무제한",
      "프로 모든 기능",
      "카카오 알림톡 무제한",
      "화이트라벨 지원",
      "커스텀 도메인",
      "전담 고객 지원",
    ],
    badge: null,
  },
];

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = searchParams.get("agencyId");

  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleNext = () => {
    if (!agencyId) return;
    router.push(`/onboarding/complete?agencyId=${agencyId}&plan=${selectedPlan}&billing=${billingCycle}`);
  };

  return (
    <div className="space-y-8">
      {/* 진행 단계 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">1</span>
        <span className="text-muted-foreground">에이전시 정보</span>
        <span className="text-muted-foreground">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
        <span className="font-medium">플랜 선택</span>
        <span className="text-muted-foreground">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</span>
        <span className="text-muted-foreground">완료</span>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">플랜을 선택해 주세요</h2>
          <p className="text-sm text-muted-foreground mt-1">14일 무료 체험 후 선택한 플랜으로 자동 전환됩니다. 언제든 변경 가능합니다.</p>
        </div>

        {/* 월/연간 토글 */}
        <div className="flex items-center gap-3 p-1 rounded-lg bg-muted w-fit">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            연간 결제
            <span className="ml-1.5 text-xs text-green-600 dark:text-green-500 font-semibold">20% 할인</span>
          </button>
        </div>

        {/* 플랜 카드 */}
        <div className="grid gap-4">
          {PLANS.map((plan) => {
            const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const isSelected = selectedPlan === plan.key;

            return (
              <Card
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-border/80"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      {plan.badge && (
                        <Badge variant="default" className="text-xs">{plan.badge}</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold">{price.toLocaleString()}원</span>
                      <span className="text-xs text-muted-foreground">/월</span>
                      {billingCycle === "yearly" && (
                        <p className="text-xs text-muted-foreground line-through">{plan.monthlyPrice.toLocaleString()}원</p>
                      )}
                    </div>
                  </div>
                  <CardDescription className="ml-6">{plan.maxClients} 클라이언트</CardDescription>
                </CardHeader>
                {isSelected && (
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5 ml-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          14일 무료 체험 기간에는 결제가 발생하지 않습니다. 체험 종료 후 선택한 플랜으로 청구됩니다.
        </div>

        <Button className="w-full" size="lg" onClick={handleNext} disabled={!agencyId}>
          {selectedPlan} 플랜으로 시작하기 (14일 무료)
        </Button>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense>
      <PlanPageContent />
    </Suspense>
  );
}
