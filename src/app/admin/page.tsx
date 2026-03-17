import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, FolderKanban, FileText, CalendarDays, Image,
  TrendingUp, Building2, CreditCard, HeartPulse, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { calcHealthScore, GRADE_META, type HealthGrade } from "@/lib/health-score";

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

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const safeCount = async (table: string) => {
    try {
      const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  const [
    clientsN, projectsN, eventsN, reportsN, assetsN,
    agenciesRes, subscriptionsRes,
    clientsRes, reportsHealthRes, notiRes, actionsRes, integrationsRes, profilesRes,
  ] = await Promise.all([
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
    // 헬스 스코어용
    supabase.from("clients").select("id, name").eq("is_active", true),
    supabase.from("reports").select("client_id, published_at").order("published_at", { ascending: false }),
    supabase.from("notification_logs").select("client_id, created_at").eq("success", true).order("created_at", { ascending: false }),
    supabase.from("actions").select("client_id, status").gte("action_date", monthStart).eq("visibility", "visible"),
    supabase.from("data_integrations").select("client_id, status"),
    supabase.from("profiles").select("user_id, client_id").eq("role", "client").not("client_id", "is", null),
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

  // ── 헬스 스코어 계산 ──
  const clients = clientsRes.data || [];

  const lastReportByClient: Record<string, string> = {};
  for (const r of reportsHealthRes.data || []) {
    if (!r.client_id || lastReportByClient[r.client_id]) continue;
    lastReportByClient[r.client_id] = r.published_at;
  }

  const lastAlimtalkByClient: Record<string, string> = {};
  for (const n of notiRes.data || []) {
    if (!n.client_id || lastAlimtalkByClient[n.client_id]) continue;
    lastAlimtalkByClient[n.client_id] = n.created_at;
  }

  const executionByClient: Record<string, { total: number; done: number }> = {};
  for (const a of actionsRes.data || []) {
    if (!a.client_id) continue;
    if (!executionByClient[a.client_id]) executionByClient[a.client_id] = { total: 0, done: 0 };
    executionByClient[a.client_id].total++;
    if (a.status === "done") executionByClient[a.client_id].done++;
  }

  const integrationByClient: Record<string, boolean | null> = {};
  for (const i of integrationsRes.data || []) {
    if (!i.client_id) continue;
    const prev = integrationByClient[i.client_id];
    if (prev === true) continue;
    integrationByClient[i.client_id] = i.status === "active" ? true : (prev ?? false);
  }

  const lastLoginByClient: Record<string, string | null> = {};
  try {
    const serviceClient = await createServiceClient();
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const loginByUserId: Record<string, string | null> = {};
    for (const u of authData?.users || []) {
      loginByUserId[u.id] = u.last_sign_in_at ?? null;
    }
    for (const p of profilesRes.data || []) {
      if (!p.client_id) continue;
      const login = loginByUserId[p.user_id] ?? null;
      const current = lastLoginByClient[p.client_id] ?? null;
      if (!current || (login && login > current)) {
        lastLoginByClient[p.client_id] = login;
      }
    }
  } catch {
    // 서비스 키 없으면 로그인 점수 0
  }

  const clientScores = clients.map((c) => {
    const hasIntegration =
      integrationByClient[c.id] !== undefined ? integrationByClient[c.id] : null;
    const result = calcHealthScore({
      lastReportDate: lastReportByClient[c.id] ?? null,
      lastAlimtalkDate: lastAlimtalkByClient[c.id] ?? null,
      executionThisMonth: executionByClient[c.id] ?? { total: 0, done: 0 },
      hasIntegration,
      lastClientLogin: lastLoginByClient[c.id] ?? null,
    });
    return { id: c.id, name: c.name, ...result };
  });

  const gradeDist: Record<HealthGrade, number> = { excellent: 0, good: 0, warning: 0, danger: 0 };
  for (const cs of clientScores) gradeDist[cs.grade]++;

  const needAttention = clientScores
    .filter((cs) => cs.grade === "danger" || cs.grade === "warning")
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

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

      {/* 클라이언트 헬스 스코어 */}
      {clients.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4" /> 클라이언트 헬스
            </h2>
            <Link href="/admin/clients" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 등급 분포 */}
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs font-medium text-muted-foreground mb-3">등급 분포 ({clients.length}개 활성 클라이언트)</p>
                <div className="grid grid-cols-4 gap-2">
                  {(["excellent", "good", "warning", "danger"] as HealthGrade[]).map((g) => {
                    const meta = GRADE_META[g];
                    return (
                      <div
                        key={g}
                        className={`rounded-xl border p-3 text-center ${meta.bg}`}
                      >
                        <div className={`text-xl font-bold ${meta.color}`}>
                          {gradeDist[g]}
                        </div>
                        <div className={`text-[10px] font-medium mt-0.5 ${meta.color}`}>
                          {meta.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 주의 필요 클라이언트 */}
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  주의 필요
                  {needAttention.length > 0 && (
                    <span className="ml-1 text-orange-600">({needAttention.length})</span>
                  )}
                </p>
                {needAttention.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                      <span className="text-emerald-600 text-lg">✓</span>
                    </div>
                    <p className="text-xs text-muted-foreground">모든 클라이언트 상태 양호</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {needAttention.map((cs) => {
                      const meta = GRADE_META[cs.grade];
                      return (
                        <Link
                          key={cs.id}
                          href={`/admin/clients/${cs.id}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors -mx-1"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                            <span className="text-sm font-medium truncate">{cs.name}</span>
                            {cs.noIntegration && (
                              <span className="text-[10px] text-muted-foreground shrink-0">연동없음</span>
                            )}
                          </div>
                          <span className={`text-xs font-bold shrink-0 ml-2 ${meta.color}`}>
                            {cs.score}점
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
