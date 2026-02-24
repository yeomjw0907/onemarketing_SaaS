import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "프로젝트 상세 | Onecation",
  description: "프로젝트 상세 및 관련 실행",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "projects")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .single();

  if (!project) notFound();

  const [relatedActionsRes, relatedEventsRes] = await Promise.all([
    supabase
      .from("actions")
      .select("id, title, status, action_date, category")
      .eq("client_id", clientId)
      .eq("visibility", "visible")
      .eq("project_id", id)
      .order("action_date", { ascending: false }),
    supabase
      .from("calendar_events")
      .select("id, title, start_at, end_at, status")
      .eq("client_id", clientId)
      .eq("visibility", "visible")
      .eq("project_id", id)
      .order("start_at", { ascending: true }),
  ]);
  const relatedActions = relatedActionsRes.data ?? [];
  const relatedEvents = relatedEventsRes.data ?? [];

  const typeLabels: Record<string, string> = {
    website: "웹사이트",
    landing: "랜딩페이지",
    promotion: "프로모션",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects" aria-label="프로젝트 목록으로">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline">{typeLabels[project.project_type] || project.project_type}</Badge>
            <StatusBadge status={project.stage} />
            <span className="text-sm text-muted-foreground">{project.progress}%</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">진행률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            {project.start_date && <span>시작: {formatDate(project.start_date)}</span>}
            {project.due_date && <span>마감: {formatDate(project.due_date)}</span>}
          </div>
        </CardContent>
      </Card>

      {project.memo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">메모</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.memo}</p>
          </CardContent>
        </Card>
      )}

      {relatedActions && relatedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관련 실행</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {relatedActions.map((action: { id: string; title: string; status: string; action_date: string }) => (
                <li key={action.id}>
                  <Link
                    href={`/execution/actions/${action.id}`}
                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted text-sm"
                  >
                    <span className="font-medium truncate">{action.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={action.status} />
                      <span className="text-xs text-muted-foreground">{formatDate(action.action_date)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(!relatedActions || relatedActions.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            이 프로젝트에 연결된 실행이 없습니다.
          </CardContent>
        </Card>
      )}

      {relatedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관련 일정</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {relatedEvents.map(
                (ev: { id: string; title: string; start_at: string; end_at: string | null; status: string }) => (
                  <li key={ev.id}>
                    <Link
                      href={`/calendar?eventId=${ev.id}`}
                      className="flex items-center justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted text-sm"
                    >
                      <span className="font-medium truncate">{ev.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={ev.status} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ev.start_at)}
                          {ev.end_at ? ` ~ ${formatDate(ev.end_at)}` : ""}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
