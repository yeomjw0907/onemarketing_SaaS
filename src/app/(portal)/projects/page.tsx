import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "projects")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("created_at", { ascending: false });

  const typeLabels: Record<string, string> = {
    website: "웹사이트",
    landing: "랜딩페이지",
    promotion: "프로모션",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderKanban className="h-6 w-6" /> Projects
        </h1>
        <p className="text-muted-foreground text-sm mt-1">진행 중인 프로젝트 현황</p>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="transition-subtle hover:shadow-md">
              <CardContent className="py-5 px-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold">{project.title}</h3>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {typeLabels[project.project_type] || project.project_type}
                    </Badge>
                  </div>
                  <StatusBadge status={project.stage} />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>진행률</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {project.start_date && (
                    <span>시작: {formatDate(project.start_date)}</span>
                  )}
                  {project.due_date && (
                    <span>마감: {formatDate(project.due_date)}</span>
                  )}
                </div>

                {project.memo && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {project.memo}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="프로젝트 없음" description="등록된 프로젝트가 없습니다." />
      )}
    </div>
  );
}
