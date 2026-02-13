import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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

  const ReportCard = ({ report }: { report: any }) => (
    <Link href={`/reports/${report.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {report.title}
                </h3>
                {report.summary && !report.summary.startsWith("<") && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {report.summary.slice(0, 80)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {report.report_type === "weekly" ? "주간" : "월간"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(report.published_at)}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

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
          <TabsTrigger value="all">전체 ({reports?.length || 0})</TabsTrigger>
          <TabsTrigger value="weekly">주간 ({weeklyReports.length})</TabsTrigger>
          <TabsTrigger value="monthly">월간 ({monthlyReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
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
                <ReportCard key={report.id} report={report} />
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
                <ReportCard key={report.id} report={report} />
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
