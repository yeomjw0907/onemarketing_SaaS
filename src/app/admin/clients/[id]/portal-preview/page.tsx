import { requireAdmin, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, clientReportTitle } from "@/lib/utils";
import { Zap, CalendarDays, FileText, ChevronRight, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ServiceCatalogView } from "@/components/service-catalog-view";
import { OverviewCharts } from "@/app/(portal)/overview/overview-charts";
import { CalendarClient } from "@/app/(portal)/calendar/calendar-client";
import { CareHistoryTimeline } from "@/components/dashboard/care-history-timeline";
import type { EnabledModules } from "@/lib/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalPreviewPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const modules = (client.enabled_modules || {}) as EnabledModules;
  const clientId = client.id;

  // ── KPI 정의 (상위 4개) ──
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

  // 캘린더 전체 이벤트
  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("start_at", { ascending: true });

  // KPI 추이 데이터
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString().split("T")[0];
  const { data: kpiTrendData } = await supabase
    .from("metrics")
    .select("period_start, period_type, metric_key, value")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .gte("period_start", twelveWeeksAgo)
    .order("period_start", { ascending: true });

  // 마케팅 플랫폼 지표
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const { data: platformMetrics } = await supabase
    .from("platform_metrics")
    .select("platform, metric_date, metric_key, metric_value")
    .eq("client_id", clientId)
    .gte("metric_date", thirtyDaysAgo)
    .order("metric_date", { ascending: true });

  // 알림 히스토리
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("client_id", clientId)
    .order("sent_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-background">
      {/* ── 관리자 미리보기 배너 ── */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2 text-amber-800 font-medium">
          <Eye className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{client.name}</span> 포털 관리자 미리보기
            <span className="ml-2 font-normal text-amber-600">· 읽기 전용</span>
          </span>
        </div>
        <Link
          href={`/admin/clients/${id}`}
          className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 underline-offset-2 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          관리자 페이지로
        </Link>
      </div>

      {/* ── 포털 콘텐츠 (max-w 제한) ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 히어로 */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-6 md:p-8">
          <p className="text-sm text-muted-foreground font-medium">안녕하세요</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">마케팅 현황을 한눈에 확인하세요</p>
        </div>

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpiCards.map((kpi, i) =>
            kpi ? (
              <Card key={kpi.id} className="border-border/50 shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground truncate">{kpi.metric_label}</p>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-2xl md:text-3xl font-bold tracking-tight">
                      {kpi.latestValue !== null ? Number(kpi.latestValue).toLocaleString() : "-"}
                    </span>
                    <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                  </div>
                  {kpi.latestNotes && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{kpi.latestNotes}</p>
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

        {/* KPI 추이 차트 */}
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

        {/* 2열: 실행 내역 | 리포트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                최근 실행 내역
              </CardTitle>
              {isModuleEnabled(modules, "execution") && (
                <span className="text-xs text-primary flex items-center gap-0.5">
                  전체보기 <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </CardHeader>
            <CardContent>
              {latestActions && latestActions.length > 0 ? (
                <div className="space-y-1">
                  {latestActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{action.title}</p>
                        <span className="text-[11px] text-muted-foreground">{formatDate(action.action_date)}</span>
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

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                최신 리포트
              </CardTitle>
              {isModuleEnabled(modules, "reports") && (
                <span className="text-xs text-primary flex items-center gap-0.5">
                  전체보기 <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </CardHeader>
            <CardContent>
              {latestReports && latestReports.length > 0 ? (
                <div className="space-y-1">
                  {latestReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg"
                    >
                      <span className="text-sm font-medium truncate flex-1">
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
                    </div>
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

        {/* 알림 히스토리 */}
        <CareHistoryTimeline
          notifications={notifications ?? []}
          limit={5}
          showViewAllLink={false}
        />

        {/* 로드맵 */}
        {isModuleEnabled(modules, "calendar") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
                로드맵
              </h2>
            </div>
            <CalendarClient
              events={calendarEvents || []}
              recentDone={doneEvents || []}
              upcomingPlanned={upcomingEvents || []}
            />
          </div>
        )}

        {/* 서비스 */}
        <ServiceCatalogView
          enabledServices={(client.enabled_services || {}) as Record<string, boolean>}
          serviceUrls={(client.service_urls || {}) as Record<string, string>}
        />
      </div>
    </div>
  );
}
