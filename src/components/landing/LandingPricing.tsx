"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    key: "starter",
    name: "스타터",
    monthly: 99000,
    yearly: 79000,
    maxClients: "클라이언트 5개",
    description: "소규모 에이전시에 적합",
    features: [
      "클라이언트 포털 최대 5개",
      "대시보드·실행·캘린더·리포트·에셋",
      "카카오 알림톡 100건/월",
      "주간·월간 성과 리포트",
      "브랜드 에셋 자료실",
      "이메일 지원",
    ],
    cta: "무료 체험 시작",
    highlight: false,
  },
  {
    key: "pro",
    name: "프로",
    monthly: 199000,
    yearly: 159000,
    maxClients: "클라이언트 20개",
    description: "성장하는 에이전시의 표준",
    features: [
      "클라이언트 포털 최대 20개",
      "스타터 모든 기능",
      "카카오 알림톡 500건/월",
      "GA4·Meta·Google Ads·Naver 연동",
      "AI 리포트 자동 생성",
      "부가 서비스 스토어",
      "우선 이메일 지원",
    ],
    cta: "무료 체험 시작",
    highlight: true,
  },
  {
    key: "agency",
    name: "에이전시",
    monthly: 399000,
    yearly: 319000,
    maxClients: "클라이언트 무제한",
    description: "대형 에이전시를 위한 풀패키지",
    features: [
      "클라이언트 포털 무제한",
      "프로 모든 기능",
      "카카오 알림톡 무제한",
      "화이트라벨 (에이전시 브랜딩)",
      "커스텀 도메인",
      "전담 고객 지원",
    ],
    cta: "문의하기",
    highlight: false,
  },
];

export function LandingPricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="py-24 bg-background" id="pricing">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12 space-y-4">
          <Badge variant="outline" className="text-xs">가격 정책</Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            투명하고 합리적인 요금제
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            14일 무료 체험, 카드 정보 불필요. 언제든 플랜 변경 가능합니다.
          </p>

          {/* 월/연간 토글 */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                  billing === "monthly"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                월간 결제
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                  billing === "yearly"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                연간 결제
                <span className="text-xs font-semibold text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full">
                  20% 절약
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 플랜 카드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = billing === "yearly" ? plan.yearly : plan.monthly;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground shadow-xl scale-[1.02]"
                    : "bg-card border border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400 shadow-sm px-3">
                      가장 인기
                    </Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className={`text-sm mt-0.5 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{price.toLocaleString()}</span>
                    <span className={`text-sm mb-1 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>원/월</span>
                  </div>
                  {billing === "yearly" && (
                    <p className={`text-xs mt-1 ${plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      연간 {(price * 12).toLocaleString()}원 청구 · 월 {plan.monthly.toLocaleString()}원 대비 절약
                    </p>
                  )}
                  <p className={`text-sm mt-2 font-medium ${plan.highlight ? "text-primary-foreground/80" : "text-foreground"}`}>
                    {plan.maxClients}
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? "text-primary-foreground" : "text-primary"}`} />
                      <span className={plan.highlight ? "text-primary-foreground/85" : "text-muted-foreground"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.highlight ? "secondary" : "default"}
                  className="w-full"
                  size="lg"
                >
                  <Link href={plan.key === "agency" ? "mailto:yeomjw0907@onecation.co.kr" : "/signup"}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          모든 플랜에는 14일 무료 체험이 포함됩니다. 카드 정보 없이 시작하세요.
          <br />
          체험 종료 후 자동 결제되며, 언제든 취소할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
