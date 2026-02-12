import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Zap, CalendarDays, FileText, Image } from "lucide-react";
import Link from "next/link";

export default async function OverviewPage() {
  const session = await requireClient();
  const modules = session.client?.enabled_modules;

  if (!isModuleEnabled(modules, "overview")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  // Fetch KPIs for overview (top 4)
  const { data: kpiDefs } = await supabase
    .from("kpi_definitions")
    .select("*")
    .eq("client_id", clientId)
    .eq("show_on_overview", true)
    .order("overview_order", { ascending: true })
    .limit(4);

  // Fetch latest metric values for each KPI
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

  // Fill to 4 cards
  while (kpiCards.length < 4) {
    kpiCards.push(null);
  }

  // Fetch latest actions
  const { data: latestActions } = await supabase
    .from("actions")
    .select("id, title, status, action_date, category")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("action_date", { ascending: false })
    .limit(5);

  // Fetch done events (last 14 days) and upcoming (next 14 days)
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

  // Fetch latest reports
  const { data: latestReports } = await supabase
    .from("reports")
    .select("id, title, report_type, published_at")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("published_at", { ascending: false })
    .limit(4);

  // Fetch recent assets
  const { data: recentAssets } = await supabase
    .from("assets")
    .select("id, title, asset_type")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {session.client?.name} 대시보드
        </p>
      </div>

      {/* KPI Cards - Always 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) =>
          kpi ? (
            <Card key={kpi.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.metric_label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.latestValue !== null
                    ? `${Number(kpi.latestValue).toLocaleString()}${kpi.unit}`
                    : "-"}
                </div>
                {kpi.latestNotes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {kpi.latestNotes}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card key={`placeholder-${i}`} className="opacity-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  KPI 미설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <p className="text-xs text-muted-foreground mt-1">
                  관리자가 설정 예정
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> 최근 실행 내역
            </CardTitle>
            {isModuleEnabled(modules, "execution") && (
              <Link href="/execution" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {latestActions && latestActions.length > 0 ? (
              <div className="space-y-3">
                {latestActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between py-1">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/execution/actions/${action.id}`}
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {action.title}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(action.action_date)}
                      </span>
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">아직 실행 내역이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Roadmap Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> 로드맵
            </CardTitle>
            {isModuleEnabled(modules, "calendar") && (
              <Link href="/calendar" className="text-sm text-primary hover:underline">
                캘린더
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  완료 (최근 14일)
                </h4>
                {doneEvents && doneEvents.length > 0 ? (
                  <div className="space-y-1">
                    {doneEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-done" />
                        <span className="flex-1 truncate">{ev.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ev.start_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">최근 완료 항목 없음</p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  예정 (향후 14일)
                </h4>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-planned" />
                        <span className="flex-1 truncate">{ev.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ev.start_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">예정된 항목 없음</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> 최신 리포트
            </CardTitle>
            {isModuleEnabled(modules, "reports") && (
              <Link href="/reports" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {latestReports && latestReports.length > 0 ? (
              <div className="space-y-2">
                {latestReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between">
                    <span className="text-sm truncate">{report.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{report.report_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(report.published_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">리포트가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Assets Quick Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" /> 에셋
            </CardTitle>
            {isModuleEnabled(modules, "assets") && (
              <Link href="/assets" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {recentAssets && recentAssets.length > 0 ? (
              <div className="space-y-2">
                {recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between">
                    <span className="text-sm truncate">{asset.title}</span>
                    <Badge variant="outline">{asset.asset_type}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">에셋이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
