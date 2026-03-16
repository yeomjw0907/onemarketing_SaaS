import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FolderKanban, FileText, CalendarDays, Image, TrendingUp, Building2, CreditCard } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "대시보드 | Onecation 관리자",
  description: "관리자 대시보드",
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 99000, yearly: 79000 * 12, name: "스타터" },
  pro:     { monthly: 199000, yearly: 159000 * 12, name: "프로" },
  agency:  { monthly: 399000, yearly: 319000 * 12, name: "에이전시" },
};

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const safeCount = async (table: string) => {
    try {
      const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  const [clientsN, projectsN, eventsN, reportsN, assetsN, agenciesRes, subscriptionsRes] =
    await Promise.all([
      safeCount("clients"),
      safeCount("projects"),
      safeCount("calendar_events"),
      safeCount("reports"),
      safeCount("assets"),
      supabase.from("agencies").select("id", { count: "exact", head: true }),
      supabase
        .from("agency_subscriptions")
        .select("plan_key, status, billing_cycle")
        .in("status", ["active", "trialing"]),
    ]);

  const agenciesN = agenciesRes.count ?? 0;
  const subs = subscriptionsRes.data ?? [];

  // MRR 계산 (active 구독만)
  const mrr = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const plan = PLAN_PRICES[s.plan_key];
      if (!plan) return sum;
      const amount = s.billing_cycle === "yearly" ? plan.yearly / 12 : plan.monthly;
      return sum + amount;
    }, 0);

  const trialN = subs.filter((s) => s.status === "trialing").length;
  const activeN = subs.filter((s) => s.status === "active").length;

  const planDist: Record<string, number> = {};
  subs.forEach((s) => {
    planDist[s.plan_key] = (planDist[s.plan_key] ?? 0) + 1;
  });

  const stats = [
    { label: "클라이언트", count: clientsN, icon: Users, href: "/admin/clients" },
    { label: "프로젝트", count: projectsN, icon: FolderKanban, href: "/admin/projects" },
    { label: "캘린더", count: eventsN, icon: CalendarDays, href: "/admin/calendar" },
    { label: "리포트", count: reportsN, icon: FileText, href: "/admin/reports" },
    { label: "자료실", count: assetsN, icon: Image, href: "/admin/assets" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">
          환영합니다, {session.profile.display_name}
        </p>
      </div>

      {/* 비즈니스 지표 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR (월간 반복 수익)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₩{mrr.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">활성 구독 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">에이전시</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agenciesN}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">활성 {activeN}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">체험 {trialN}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">플랜 분포</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.keys(PLAN_PRICES).map((key) =>
                planDist[key] ? (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {PLAN_PRICES[key].name} {planDist[key]}
                  </Badge>
                ) : null
              )}
              {!subs.length && (
                <span className="text-xs text-muted-foreground">구독 없음</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 콘텐츠 현황 */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">콘텐츠 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href} href={stat.href}>
                <Card className="hover:shadow-md cursor-pointer transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.count}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
