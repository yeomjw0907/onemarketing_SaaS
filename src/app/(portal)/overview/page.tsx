import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, clientReportTitle } from "@/lib/utils";
import {
  Zap, CalendarDays, FileText,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ServiceCatalogView } from "@/components/service-catalog-view";
import { OverviewCharts } from "./overview-charts";
import { CalendarClient } from "@/app/(portal)/calendar/calendar-client";

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

  // 각 KPI 최신값
  const kpiCards = [];
  if (kpiDefs) {
    for (const kpi of kpiDefs) {
      const { data: latestMetric } = await supabase
        .from("metrics")
        .select("value, notes, period_start")
        .eq("client_id", clientId)
        .eq("metric_key", kpi.metric_key)
        .eq("visibility", "visible")
        .order("period_start", { ascending: false })
        .limit(1)
        .single();

      kpiCards.push({
        ...kpi,
        latestValue: latestMetric?.value ?? null,
        latestNotes: latestMetric?.notes ?? null,
      });
    }
  }
  while (kpiCards.length < 4) kpiCards.push(null);

  // 최근 실행 내역
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

  // 최신 리포트
  const { data: latestReports } = await supabase
    .from("reports")
    .select("id, title, report_type, published_at")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("published_at", { ascending: false })
    .limit(4);

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

  return (
    <div className="space-y-8">
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
          kpi ? (
            <Card key={kpi.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {kpi.metric_label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl md:text-3xl font-bold tracking-tight">
                    {kpi.latestValue !== null
                      ? Number(kpi.latestValue).toLocaleString()
                      : "-"}
                  </span>
                  <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                </div>
                {kpi.latestNotes && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
                    {kpi.latestNotes}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
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
                {latestReports.map((report) => (
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

      {/* ─── 서비스 항목 ─── */}
      <ServiceCatalogView enabledServices={(session.client?.enabled_services || {}) as Record<string, boolean>} serviceUrls={(session.client?.service_urls || {}) as Record<string, string>} />
    </div>
  );
}
