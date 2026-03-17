import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChevronRight, CalendarDays, BookOpen } from "lucide-react";
import { formatDate, clientReportTitle, stripHtml } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "리포트 | Onecation",
  description: "마케팅 주간·월간 리포트",
};

export default async function ReportsPage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "reports")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("published_at", { ascending: false });

  const weeklyReports = reports?.filter((r) => r.report_type === "weekly") || [];
  const monthlyReports = reports?.filter((r) => r.report_type === "monthly") || [];

  const ReportCard = ({ report }: { report: Record<string, unknown> }) => {
    const isWeekly = report.report_type === "weekly";
    const rawSummary = typeof report.summary === "string" ? report.summary : null;
    const summary = rawSummary ? stripHtml(rawSummary).trim() || null : null;

    return (
      <Link href={`/reports/${report.id}`}>
        <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer group overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-stretch gap-0">
              {/* 왼쪽 컬러 액센트 바 */}
              <div
                className={`w-1 shrink-0 rounded-l-xl ${isWeekly ? "bg-blue-400" : "bg-violet-400"}`}
              />

              <div className="flex-1 flex items-center gap-4 px-5 py-4">
                {/* 아이콘 */}
                <div
                  className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${
                    isWeekly
                      ? "bg-blue-50 text-blue-600"
                      : "bg-violet-50 text-violet-600"
                  }`}
                >
                  {isWeekly ? (
                    <BookOpen className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isWeekly
                          ? "bg-blue-100 text-blue-700"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {isWeekly ? "주간" : "월간"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(report.published_at as string)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mt-1.5 group-hover:text-primary transition-colors line-clamp-1">
                    {clientReportTitle(report.title as string)}
                  </h3>
                  {summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {summary}
                    </p>
                  )}
                </div>

                {/* 화살표 */}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" /> 리포트
        </h1>
        <p className="text-muted-foreground text-sm mt-1">마케팅 리포트</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            전체 <span className="ml-1.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5">{reports?.length || 0}</span>
          </TabsTrigger>
          <TabsTrigger value="weekly">
            주간 <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">{weeklyReports.length}</span>
          </TabsTrigger>
          <TabsTrigger value="monthly">
            월간 <span className="ml-1.5 text-[10px] bg-violet-100 text-violet-700 rounded-full px-1.5 py-0.5">{monthlyReports.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id as string} report={report as Record<string, unknown>} />
              ))}
            </div>
          ) : (
            <EmptyState title="리포트 없음" description="등록된 리포트가 없습니다." />
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          {weeklyReports.length > 0 ? (
            <div className="space-y-3">
              {weeklyReports.map((report) => (
                <ReportCard key={report.id as string} report={report as Record<string, unknown>} />
              ))}
            </div>
          ) : (
            <EmptyState title="주간 리포트 없음" />
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          {monthlyReports.length > 0 ? (
            <div className="space-y-3">
              {monthlyReports.map((report) => (
                <ReportCard key={report.id as string} report={report as Record<string, unknown>} />
              ))}
            </div>
          ) : (
            <EmptyState title="월간 리포트 없음" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
