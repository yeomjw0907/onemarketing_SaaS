import type { Metadata } from "next";
import { Suspense } from "react";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, clientReportTitle, stripHtml } from "@/lib/utils";
import {
  Zap, CalendarDays, FileText,
  ChevronRight, TrendingUp, TrendingDown, Minus, Target,
} from "lucide-react";
import Link from "next/link";
import { ServiceCatalogView } from "@/components/service-catalog-view";
import { OverviewCharts } from "./overview-charts";
import { OverviewUrlCleaner } from "./overview-url-cleaner";
import { CalendarClient } from "@/app/(portal)/calendar/calendar-client";
import { CareHistoryTimeline } from "@/components/dashboard/care-history-timeline";
import { ActivityFeed } from "./activity-feed";
import type { ActivityItem } from "./activity-feed";
import { findServiceItem } from "@/lib/service-catalog";

export const metadata: Metadata = {
  title: "개요 | Onecation",
  description: "클라이언트 대시보드 개요 및 요약",
};

export default async function OverviewPage() {
  const session = await requireClient();
  const modules = session.client?.enabled_modules;

  if (!isModuleEnabled(modules, "overview")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  // KPI 정의 (상위 4개)
  const { data: kpiDefs } = await supabase
    .from("kpi_definitions")
    .select("*")
    .eq("client_id", clientId)
    .eq("show_on_overview", true)
    .order("overview_order", { ascending: true })
    .limit(4);

  // 각 KPI 최신값 + 이전 기간값 (MoM 비교)
  const kpiCards = [];
  if (kpiDefs) {
    for (const kpi of kpiDefs) {
      const { data: recentMetrics } = await supabase
        .from("metrics")
        .select("value, notes, period_start, period_type")
        .eq("client_id", clientId)
        .eq("metric_key", kpi.metric_key)
        .eq("visibility", "visible")
        .order("period_start", { ascending: false })
        .limit(2);

      const current = recentMetrics?.[0] ?? null;
      const prev = recentMetrics?.[1] ?? null;

      kpiCards.push({
        ...kpi,
        latestValue: current?.value ?? null,
        latestNotes: current?.notes ?? null,
        prevValue: prev?.value ?? null,
      });
    }
  }
  while (kpiCards.length < 4) kpiCards.push(null);

  // 최근 실행 내역 (홈 카드용)
  const { data: latestActions } = await supabase
    .from("actions")
    .select("id, title, status, action_date, category")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("action_date", { ascending: false })
    .limit(5);

  // 이벤트
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
  const twoWeeksLater = new Date(now.getTime() + 14 * 86400000).toISOString();

  const { data: doneEvents } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, status")
    .eq("client_id", clientId)
    .eq("status", "done")
    .gte("start_at", twoWeeksAgo)
    .order("start_at", { ascending: false })
    .limit(5);

  const { data: upcomingEvents } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, status")
    .eq("client_id", clientId)
    .eq("status", "planned")
    .lte("start_at", twoWeeksLater)
    .gte("start_at", now.toISOString())
    .order("start_at", { ascending: true })
    .limit(5);

  // 최신 리포트 (summary 포함 — 활동 피드에서 활용)
  const { data: latestReports } = await supabase
    .from("reports")
    .select("id, title, report_type, published_at, summary")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("published_at", { ascending: false })
    .limit(6);

  // 캘린더 전체 이벤트 (로드맵 달력용)
  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("start_at", { ascending: true });

  // ── KPI 추이 데이터 (최근 12주/6개월) ──
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString().split("T")[0];
  const { data: kpiTrendData } = await supabase
    .from("metrics")
    .select("period_start, period_type, metric_key, value")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .gte("period_start", twelveWeeksAgo)
    .order("period_start", { ascending: true });

  // ── 마케팅 플랫폼 지표 (최근 30일) ──
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const { data: platformMetrics } = await supabase
    .from("platform_metrics")
    .select("platform, metric_date, metric_key, metric_value")
    .eq("client_id", clientId)
    .gte("metric_date", thirtyDaysAgo)
    .order("metric_date", { ascending: true });

  // ── 알림 히스토리 (월/수/목 발송 건) ──
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("client_id", clientId)
    .order("sent_at", { ascending: false })
    .limit(20);

  // ── A-1: 실행 목표 달성률 계산 ──
  const executionTargets = (session.client?.execution_targets ?? {}) as Record<
    string,
    { period: string; target: number }
  >;
  const hasTargets =
    isModuleEnabled(modules, "execution") &&
    Object.values(executionTargets).some(
      (e) => e && typeof e.target === "number" && e.target > 0
    );

  type ProgressEntry = {
    current: number;
    target: number;
    periodLabel: string;
    color: string;
    label: string;
  };
  const progressByCategory: Record<string, ProgressEntry> = {};

  if (hasTargets) {
    const { data: allActions } = await supabase
      .from("actions")
      .select("action_date, category")
      .eq("client_id", clientId)
      .eq("visibility", "visible");

    const n = new Date();
    for (const [key, entry] of Object.entries(executionTargets)) {
      if (!entry || typeof entry.target !== "number" || entry.target <= 0) continue;

      const period = entry.period === "weekly" ? "weekly" : "monthly";
      let periodStart: string, periodEnd: string, periodLabel: string;

      if (period === "monthly") {
        const y = n.getFullYear(), m = n.getMonth();
        periodStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(y, m + 1, 0).getDate();
        periodEnd = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        periodLabel = "이번 달";
      } else {
        const day = n.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const mon = new Date(n);
        mon.setDate(n.getDate() + diff);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        periodStart = mon.toISOString().slice(0, 10);
        periodEnd = sun.toISOString().slice(0, 10);
        periodLabel = "이번 주";
      }

      const current = (allActions || []).filter((a) => {
        const date = (a.action_date ?? "").toString().slice(0, 10);
        if (date < periodStart || date > periodEnd) return false;
        const parts = (a.category ?? "")
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean);
        return parts.includes(key);
      }).length;

      const item = findServiceItem(key);
      progressByCategory[key] = {
        current,
        target: entry.target,
        periodLabel,
        color: item?.color ?? "#64748b",
        label: key === "general" ? "일반" : (item?.label ?? key.replace(/_/g, " ")),
      };
    }
  }

  // ── B-1: 활동 피드 — 최근 완료 액션 (30일) ──
  const { data: recentDoneActions } = await supabase
    .from("actions")
    .select("id, title, action_date, category")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .eq("status", "done")
    .gte("action_date", thirtyDaysAgo)
    .order("action_date", { ascending: false })
    .limit(10);

  // 활동 피드 아이템 통합
  const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
    MON_REVIEW: "지난주 리뷰 발송",
    WED_BUDGET: "예산 점검 발송",
    THU_PROPOSAL: "제안 발송",
  };

  const activityItems: ActivityItem[] = [
    // 알림톡 발송
    ...(notifications ?? []).map((n) => ({
      id: `notif-${n.id}`,
      type: "notification" as const,
      title: NOTIFICATION_TYPE_LABELS[n.report_type] ?? n.report_type,
      description: n.ai_message ?? undefined,
      timestamp: n.sent_at,
      href: `/report/v/${n.view_token}`,
    })),
    // 리포트 발행
    ...(latestReports ?? []).slice(0, 5).map((r) => {
      const rawSummary = typeof r.summary === "string" ? r.summary : null;
      const cleanSummary = rawSummary
        ? stripHtml(rawSummary).slice(0, 60) || null
        : null;
      return {
        id: `report-${r.id}`,
        type: "report" as const,
        title: clientReportTitle(r.title),
        description: cleanSummary ?? undefined,
        timestamp: r.published_at ?? now.toISOString(),
        href: `/reports/${r.id}`,
      };
    }),
    // 실행 항목 완료
    ...(recentDoneActions ?? []).map((a) => ({
      id: `action-${a.id}`,
      type: "action_done" as const,
      title: stripHtml(a.title) || a.title,
      timestamp: `${(a.action_date ?? "").toString().slice(0, 10)}T12:00:00`,
      href: `/execution/actions/${a.id}`,
    })),
    // 완료된 일정 (2주 이내)
    ...(doneEvents ?? []).map((e) => ({
      id: `event-${e.id}`,
      type: "calendar" as const,
      title: e.title,
      timestamp: e.start_at,
    })),
  ];

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <OverviewUrlCleaner />
      </Suspense>

      {/* ─── 히어로 영역 ─── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-6 md:p-8">
        <p className="text-sm text-muted-foreground font-medium">안녕하세요</p>
        <h1 className="text-2xl md:text-3xl font-bold mt-1 tracking-tight">
          {session.client?.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          마케팅 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* ─── KPI 카드 ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, i) =>
          kpi ? (() => {
            const cur = kpi.latestValue !== null ? Number(kpi.latestValue) : null;
            const prv = kpi.prevValue !== null ? Number(kpi.prevValue) : null;
            let changePct: number | null = null;
            if (cur !== null && prv !== null && prv !== 0) {
              changePct = ((cur - prv) / Math.abs(prv)) * 100;
            }
            return (
              <Card key={kpi.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground truncate">
                    {kpi.metric_label}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-2xl md:text-3xl font-bold tracking-tight">
                      {cur !== null ? cur.toLocaleString() : "-"}
                    </span>
                    <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {kpi.latestNotes && (
                      <p className="text-[11px] text-muted-foreground truncate flex-1">
                        {kpi.latestNotes}
                      </p>
                    )}
                    {changePct !== null ? (
                      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ml-auto ${
                        changePct > 0 ? "text-emerald-600" : changePct < 0 ? "text-rose-500" : "text-muted-foreground"
                      }`}>
                        {changePct > 0
                          ? <TrendingUp className="h-3 w-3" />
                          : changePct < 0
                          ? <TrendingDown className="h-3 w-3" />
                          : <Minus className="h-3 w-3" />}
                        {changePct > 0 ? "+" : ""}{changePct.toFixed(1)}%
                      </span>
                    ) : prv === null && cur !== null ? (
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-auto">이전 기간 없음</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })() : (
            <Card key={`ph-${i}`} className="border-dashed border-border/40 bg-muted/20">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground/60">KPI 미설정</p>
                <div className="text-2xl md:text-3xl font-bold text-muted-foreground/30 mt-2">-</div>
                <p className="text-[11px] text-muted-foreground/50 mt-1.5">관리자가 설정 예정</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* ─── KPI 추이 차트 ─── */}
      <OverviewCharts
        kpiDefs={(kpiDefs || []).map((k) => ({
          metric_key: k.metric_key,
          metric_label: k.metric_label,
          unit: k.unit,
        }))}
        kpiTrendData={(kpiTrendData || []).map((d) => ({
          period_start: d.period_start,
          period_type: d.period_type as "weekly" | "monthly",
          metric_key: d.metric_key,
          value: d.value,
        }))}
        platformMetrics={(platformMetrics || []).map((m) => ({
          platform: m.platform,
          metric_date: m.metric_date,
          metric_key: m.metric_key,
          metric_value: m.metric_value,
        }))}
      />

      {/* ─── A-1: 이번 달/주 목표 달성률 ─── */}
      {Object.keys(progressByCategory).length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Target className="h-3.5 w-3.5" />
              </div>
              목표 달성률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {Object.entries(progressByCategory).map(([, prog]) => {
                const pct = Math.min(100, Math.round((prog.current / prog.target) * 100));
                return (
                  <div key={prog.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{prog.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {prog.current} / {prog.target} ({prog.periodLabel})
                        </span>
                        {pct >= 100 && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                            달성!
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: prog.color }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-semibold tabular-nums w-8 text-right"
                        style={{ color: prog.color }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 2열 그리드: 최근 실행 내역 | 최신 리포트 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 최근 실행 내역 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5" />
              </div>
              최근 실행 내역
            </CardTitle>
            {isModuleEnabled(modules, "execution") && (
              <Link href="/execution" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                전체보기 <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {latestActions && latestActions.length > 0 ? (
              <div className="space-y-1">
                {latestActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{action.title}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(action.action_date)}
                      </span>
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">아직 실행 내역이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최신 리포트 */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <FileText className="h-3.5 w-3.5" />
              </div>
              최신 리포트
            </CardTitle>
            {isModuleEnabled(modules, "reports") && (
              <Link href="/reports" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                전체보기 <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {latestReports && latestReports.length > 0 ? (
              <div className="space-y-1">
                {latestReports.slice(0, 4).map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-sm font-medium truncate flex-1 group-hover:text-primary transition-colors">
                      {clientReportTitle(report.title)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {report.report_type === "weekly" ? "주간" : "월간"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(report.published_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">리포트가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 알림 히스토리 ─── */}
      <CareHistoryTimeline
        notifications={notifications ?? []}
        limit={5}
        showViewAllLink={isModuleEnabled(modules, "timeline")}
      />

      {/* ─── 로드맵 (캘린더 전체 너비, 세로로 길게) ─── */}
      {isModuleEnabled(modules, "calendar") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
              로드맵
            </h2>
            <Link href="/calendar" className="text-sm text-primary hover:underline flex items-center gap-0.5">
              캘린더 전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <CalendarClient
            events={calendarEvents || []}
            recentDone={doneEvents || []}
            upcomingPlanned={upcomingEvents || []}
          />
        </div>
      )}

      {/* ─── B-1: 최근 활동 피드 ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">📋</span>
            최근 활동
          </h2>
          <p className="text-xs text-muted-foreground">대행사 활동 전체 기록</p>
        </div>
        <ActivityFeed items={activityItems} />
      </div>

      {/* ─── 서비스 항목 ─── */}
      <ServiceCatalogView
        enabledServices={(session.client?.enabled_services || {}) as Record<string, boolean>}
        serviceUrls={(session.client?.service_urls || {}) as Record<string, string>}
      />
    </div>
  );
}
