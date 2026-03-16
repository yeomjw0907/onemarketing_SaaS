"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Step 1: 에이전시 정보 입력 */
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const agencyName = name.trim();
    if (!agencyName) {
      setError("에이전시(회사) 이름을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 에이전시 생성
      const { data: agency, error: agencyError } = await supabase
        .from("agencies")
        .insert({ name: agencyName, owner_user_id: user.id })
        .select("id")
        .single();

      if (agencyError || !agency) {
        setError("에이전시 생성에 실패했습니다. 다시 시도해 주세요.");
        setLoading(false);
        return;
      }

      // 프로필에 agency_id 연결
      await supabase
        .from("profiles")
        .update({ agency_id: agency.id })
        .eq("user_id", user.id);

      // 14일 무료 체험 구독 생성 (스타터 플랜으로 시작)
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await supabase.from("agency_subscriptions").insert({
        agency_id: agency.id,
        plan_key: "starter",
        status: "trialing",
        billing_cycle: "monthly",
        trial_ends_at: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
      });

      // 플랜 선택 페이지로 이동
      router.push(`/onboarding/plan?agencyId=${agency.id}`);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 진행 단계 표시 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
        <span className="font-medium">에이전시 정보</span>
        <span className="text-muted-foreground">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</span>
        <span className="text-muted-foreground">플랜 선택</span>
        <span className="text-muted-foreground">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</span>
        <span className="text-muted-foreground">완료</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">에이전시 정보 입력</CardTitle>
              <CardDescription>서비스에서 사용할 에이전시 이름을 입력해 주세요.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">에이전시(회사) 이름 <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="예: 원마케팅, (주)디지털팩토리"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
              <strong>14일 무료 체험</strong>이 시작됩니다. 체험 기간 동안 모든 기능을 무료로 이용할 수 있으며, 카드 정보 없이 시작할 수 있습니다.
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />처리 중...</>
              ) : (
                "다음 단계로 →"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
