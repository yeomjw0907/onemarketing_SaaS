import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, stripHtml } from "@/lib/utils";
import { findServiceItem } from "@/lib/service-catalog";
import { ArrowLeft, ExternalLink, CalendarDays, FolderKanban } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActionDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "execution")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("actions")
    .select("*")
    .eq("id", resolvedParams.id)
    .eq("client_id", session.profile.client_id!)
    .single();

  const action = data as any;

  if (!action) {
    notFound();
  }

  const { data: relatedEvents } = await supabase
    .from("calendar_events")
    .select("id, title")
    .eq("client_id", session.profile.client_id!)
    .eq("visibility", "visible")
    .contains("related_action_ids", [resolvedParams.id]);

  const { data: relatedProject } =
    action.project_id
      ? await supabase
          .from("projects")
          .select("id, title")
          .eq("id", action.project_id)
          .eq("client_id", session.profile.client_id!)
          .eq("visibility", "visible")
          .single()
      : { data: null };

  const links = Array.isArray(action.links) ? action.links : [];
  const categoryKeys = (action.category ?? "")
    .split(",")
    .map((c: string) => c.trim())
    .filter(Boolean);
  const categoryKeysOrGeneral = categoryKeys.length ? categoryKeys : ["general"];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/execution" aria-label="실행 현황으로">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{stripHtml(action.title) || action.title}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {categoryKeysOrGeneral.map((k: string) => {
              const item = findServiceItem(k);
              const label = item?.label ?? (k === "general" ? "일반" : k.replace(/_/g, " "));
              return (
                <Badge key={k} variant="outline">
                  {label}
                </Badge>
              );
            })}
            <StatusBadge status={action.status} />
            <span className="text-sm text-muted-foreground">
              {formatDate(action.action_date)}
            </span>
          </div>
        </div>
      </div>

      {action.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">설명</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{stripHtml(action.description)}</p>
          </CardContent>
        </Card>
      )}

      {relatedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관련 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${relatedProject.id}`} className="gap-2">
                <FolderKanban className="h-3 w-3" />
                {relatedProject.title}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {relatedEvents && relatedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관련 일정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {relatedEvents.map((ev: { id: string; title: string }) => (
                <Button key={ev.id} variant="outline" size="sm" asChild>
                  <Link href={`/calendar?eventId=${ev.id}`} className="gap-2">
                    <CalendarDays className="h-3 w-3" />
                    {ev.title}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">관련 링크</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {links.map((link: any, i: number) => (
                <a
                  key={i}
                  href={link.url || link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label || link.url || link}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
