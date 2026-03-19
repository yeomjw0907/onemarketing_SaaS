import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, FolderKanban, FileText, CalendarDays, Image,
  TrendingUp, Building2, CreditCard, HeartPulse, ChevronRight,
  ArrowUpRight, ListChecks, AlertTriangle, Eye, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { calcHealthScore, GRADE_META, type HealthGrade } from "@/lib/health-score";
import { AdminTodoTabs } from "./admin-todo-tabs";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

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
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const weekEnd = new Date(now.getTime() + 7 * 86400000).toISOString();

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
    pendingApprovalsRes, weekEventsRes, todayEventsRes,
    perfAlertsRes, recentViewsRes,
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
    supabase.from("clients").select("id, name").eq("is_active", true),
    supabase.from("reports").select("client_id, published_at").order("published_at", { ascending: false }),
    supabase.from("notification_logs").select("client_id, created_at").eq("success", true).order("created_at", { ascending: false }),
    supabase.from("actions").select("client_id, status").gte("action_date", monthStart).eq("visibility", "visible"),
    supabase.from("data_integrations").select("client_id, status"),
    supabase.from("profiles").select("user_id, client_id").eq("role", "client").not("client_id", "is", null),
    supabase
      .from("notifications")
      .select("id, client_id, report_type, sent_at, view_token")
      .eq("report_type", "THU_PROPOSAL")
      .eq("approval_status", "PENDING")
      .gt("approval_token_expires_at", now.toISOString())
      .order("sent_at", { ascending: false }),
    supabase
      .from("calendar_events")
      .select("id, title, start_at, client_id")
      .eq("status", "planned")
      .gte("start_at", now.toISOString())
      .lte("start_at", weekEnd)
      .order("start_at", { ascending: true })
      .limit(10),
    supabase
      .from("calendar_events")
      .select("id, title, start_at, client_id")
      .eq("status", "planned")
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd)
      .order("start_at", { ascending: true }),
    // 미해결 성과 이상 감지 알림 (최신 10건)
    supabase
      .from("performance_alerts")
      .select("id, client_id, alert_type, severity, title, message, detected_at, is_read")
      .is("resolved_at", null)
      .order("detected_at", { ascending: false })
      .limit(10),
    // 미열람 리포트 최신 5건 (어드민용)
    supabase
      .from("report_views")
      .select("report_id, opened_at, duration_seconds, client_id")
      .order("opened_at", { ascending: false })
      .limit(20),
  ]);

  const agenciesN = agenciesRes.count ?? 0;
  const subs = subscriptionsRes.data ?? [];

  const mrr = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const plan = PLAN_PRICES[s.plan_key];
      if (!plan) return sum;
      return sum + (s.billing_cycle === "yearly" ? plan.yearly / 12 : plan.monthly);
    }, 0);

  const trialN = subs.filter((s) => s.status === "trialing").length;
  const activeN = subs.filter((s) => s.status === "active").length;

  const planDist: Record<string, number> = {};
  subs.forEach((s) => {
    planDist[s.plan_key] = (planDist[s.plan_key] ?? 0) + 1;
  });

  const clients = clientsRes.data || [];
  const clientNameById = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const pendingApprovals = pendingApprovalsRes.data ?? [];
  const weekEvents = weekEventsRes.data ?? [];
  const todayEvents = todayEventsRes.data ?? [];
  const perfAlerts = perfAlertsRes.data ?? [];
  const recentViews = recentViewsRes.data ?? [];

  // 투두 총 개수
  const todoTotal = todayEvents.length + pendingApprovals.length;

  // ── 헬스 스코어 ──────────────────────────────────────────────────────────
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
    for (const u of authData?.users || []) loginByUserId[u.id] = u.last_sign_in_at ?? null;
    for (const p of profilesRes.data || []) {
      if (!p.client_id) continue;
      const login = loginByUserId[p.user_id] ?? null;
      const current = lastLoginByClient[p.client_id] ?? null;
      if (!current || (login && login > current)) lastLoginByClient[p.client_id] = login;
    }
  } catch { /* 서비스 키 없으면 로그인 점수 0 */ }

  const clientScores = clients.map((c) => {
    const result = calcHealthScore({
      lastReportDate: lastReportByClient[c.id] ?? null,
      lastAlimtalkDate: lastAlimtalkByClient[c.id] ?? null,
      executionThisMonth: executionByClient[c.id] ?? { total: 0, done: 0 },
      hasIntegration: integrationByClient[c.id] !== undefined ? integrationByClient[c.id] : null,
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

  const stats = [
    { label: "클라이언트", count: clientsN, icon: Users, href: "/admin/clients", color: "text-violet-600", bg: "bg-violet-50" },
    { label: "프로젝트", count: projectsN, icon: FolderKanban, href: "/admin/projects", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "캘린더", count: eventsN, icon: CalendarDays, href: "/admin/calendar", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "리포트", count: reportsN, icon: FileText, href: "/admin/reports", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "자료실", count: assetsN, icon: Image, href: "/admin/assets", color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const todayLabel = format(now, "M월 d일 (E)", { locale: ko });

  return (
    <div className="space-y-8">
      {/* ── 헤더 ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {todayLabel} · 안녕하세요, {session.profile.display_name}
          </p>
        </div>
        {todoTotal > 0 && (
          <div className="flex items-center gap-2 bg-primary/8 text-primary border border-primary/20 rounded-xl px-3 py-2">
            <ListChecks className="h-4 w-4" />
            <span className="text-sm font-semibold">처리할 항목 {todoTotal}건</span>
          </div>
        )}
      </div>

      {/* ── 성과 이상 감지 알림 ───────────────────────────────────────────── */}
      {perfAlerts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            성과 이상 감지
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5">
              {perfAlerts.length}
            </span>
          </h2>
          <div className="space-y-2">
            {perfAlerts.map((alert: any) => (
              <Link key={alert.id} href={`/admin/clients/${alert.client_id}`}>
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors ${
                  alert.severity === "critical"
                    ? "border-red-200 bg-red-50/50"
                    : "border-amber-200 bg-amber-50/50"
                }`}>
                  <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    alert.severity === "critical" ? "text-red-500" : "text-amber-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(alert.detected_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 리포트 열람 현황 ─────────────────────────────────────────────── */}
      {recentViews.length > 0 && (
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-blue-500" />
            최근 리포트 열람
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentViews.slice(0, 6).map((v: any) => (
              <div key={v.report_id + v.client_id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {clientNameById[v.client_id] || "클라이언트"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.opened_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {v.duration_seconds > 0 && ` · ${v.duration_seconds >= 60
                      ? `${Math.floor(v.duration_seconds / 60)}분`
                      : `${v.duration_seconds}초`}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 할 일 섹션 (항상 표시) ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            할 일
          </h2>
          <Link
            href="/admin/calendar"
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            캘린더 전체 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-5 px-5">
            <AdminTodoTabs
              todayEvents={todayEvents}
              weekEvents={weekEvents}
              pendingApprovals={pendingApprovals}
              clientNameById={clientNameById}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── 비즈니스 지표 ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          비즈니스 지표
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-muted-foreground">MRR</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-2xl font-bold text-primary">
                ₩{mrr.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">활성 구독 기준 월간 반복 수익</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-muted-foreground">에이전시</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="text-2xl font-bold">{agenciesN}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-emerald-600 font-medium">활성 {activeN}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-amber-600 font-medium">체험 {trialN}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-medium text-muted-foreground">플랜 분포</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(PLAN_PRICES).map((key) =>
                  planDist[key] ? (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {PLAN_PRICES[key].name} {planDist[key]}
                    </Badge>
                  ) : null
                )}
                {!subs.length && (
                  <span className="text-xs text-muted-foreground mt-1">구독 없음</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 클라이언트 헬스 ───────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-primary" />
              클라이언트 헬스
            </h2>
            <Link href="/admin/clients" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 등급 분포 */}
            <Card>
              <CardContent className="pt-5 px-5">
                <p className="text-xs font-medium text-muted-foreground mb-4">
                  등급 분포 · 활성 {clients.length}개
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(["excellent", "good", "warning", "danger"] as HealthGrade[]).map((g) => {
                    const meta = GRADE_META[g];
                    return (
                      <div key={g} className={`rounded-xl border p-3 text-center ${meta.bg}`}>
                        <div className={`text-2xl font-bold ${meta.color}`}>{gradeDist[g]}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${meta.color}`}>{meta.label}</div>
                      </div>
                    );
                  })}
                </div>
                {/* 전체 바 */}
                {clients.length > 0 && (
                  <div className="flex rounded-full overflow-hidden h-1.5 mt-4 gap-px">
                    {(["excellent", "good", "warning", "danger"] as HealthGrade[]).map((g) => {
                      const pct = (gradeDist[g] / clients.length) * 100;
                      if (pct === 0) return null;
                      const colors = { excellent: "bg-emerald-400", good: "bg-blue-400", warning: "bg-amber-400", danger: "bg-rose-400" };
                      return <div key={g} className={colors[g]} style={{ width: `${pct}%` }} />;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 주의 필요 */}
            <Card>
              <CardContent className="pt-5 px-5">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  주의 필요
                  {needAttention.length > 0 && (
                    <span className="ml-1.5 text-rose-600 font-semibold">({needAttention.length})</span>
                  )}
                </p>
                {needAttention.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                      <span className="text-emerald-600 text-base">✓</span>
                    </div>
                    <p className="text-xs text-muted-foreground">모든 클라이언트 상태 양호</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {needAttention.map((cs) => {
                      const meta = GRADE_META[cs.grade];
                      return (
                        <Link
                          key={cs.id}
                          href={`/admin/clients/${cs.id}`}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors -mx-1 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
                            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {cs.name}
                            </span>
                            {cs.noIntegration && (
                              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">연동없음</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`text-xs font-bold ${meta.color}`}>{cs.score}점</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                          </div>
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

      {/* ── 콘텐츠 현황 ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary" />
          콘텐츠 현황
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href} href={stat.href}>
                <Card className="hover:shadow-md cursor-pointer transition-all hover:border-primary/30 group">
                  <CardContent className="pt-4 pb-4 px-4">
                    <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {stat.count}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
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
