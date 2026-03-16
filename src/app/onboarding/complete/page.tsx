"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Users, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PLAN_NAMES: Record<string, string> = {
  starter: "스타터",
  pro: "프로",
  agency: "에이전시",
};

function CompletePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyId = searchParams.get("agencyId");
  const planKey = searchParams.get("plan") ?? "starter";
  const billing = searchParams.get("billing") ?? "monthly";

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // 선택한 플랜으로 구독 업데이트 (무료 체험 유지, 플랜만 변경)
    if (!agencyId) return;

    const supabase = createClient();
    supabase
      .from("agency_subscriptions")
      .update({ plan_key: planKey, billing_cycle: billing })
      .eq("agency_id", agencyId)
      .then(() => setDone(true));
  }, [agencyId, planKey, billing]);

  const handleGoToDashboard = async () => {
    setSaving(true);
    // 관리자 대시보드(admin)로 이동 — 에이전시 오너는 admin 역할을 가짐
    router.push("/admin");
  };

  const planName = PLAN_NAMES[planKey] ?? planKey;

  return (
    <div className="space-y-8">
      {/* 진행 단계 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">1</span>
        <span className="text-muted-foreground">에이전시 정보</span>
        <span className="text-muted-foreground">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</span>
        <span className="text-muted-foreground">플랜 선택</span>
        <span className="text-muted-foreground">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
        <span className="font-medium">완료</span>
      </div>

      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle className="text-lg">준비 완료!</CardTitle>
              <CardDescription>
                <strong>{planName} 플랜</strong> 14일 무료 체험이 시작되었습니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <p className="font-medium">다음 단계로 진행하세요:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li>관리자 대시보드에서 첫 번째 클라이언트를 생성하세요</li>
              <li>클라이언트에게 이메일 초대장을 발송하세요</li>
              <li>KPI 목표와 마케팅 실행 내역을 입력하세요</li>
              <li>클라이언트가 포털에 접속해 성과를 확인합니다</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">클라이언트 초대</p>
                <p className="text-xs text-muted-foreground mt-0.5">이메일로 클라이언트를 초대하고 전용 포털을 바로 제공</p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">14일 무료 체험</p>
                <p className="text-xs text-muted-foreground mt-0.5">카드 등록 없이 모든 기능을 자유롭게 사용</p>
              </CardContent>
            </Card>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleGoToDashboard}
            disabled={saving || !done}
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />이동 중...</>
            ) : (
              <>대시보드 시작하기 <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense>
      <CompletePageContent />
    </Suspense>
  );
}
