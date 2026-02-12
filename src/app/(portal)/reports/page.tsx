import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { FileItemCard } from "@/components/file-item-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" /> Reports
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
                <FileItemCard
                  key={report.id}
                  title={report.title}
                  subtitle={report.summary || ""}
                  date={report.published_at}
                  badge={report.report_type}
                  bucket="reports"
                  filePath={report.file_path}
                />
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
                <FileItemCard
                  key={report.id}
                  title={report.title}
                  subtitle={report.summary || ""}
                  date={report.published_at}
                  badge="weekly"
                  bucket="reports"
                  filePath={report.file_path}
                />
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
                <FileItemCard
                  key={report.id}
                  title={report.title}
                  subtitle={report.summary || ""}
                  date={report.published_at}
                  badge="monthly"
                  bucket="reports"
                  filePath={report.file_path}
                />
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
