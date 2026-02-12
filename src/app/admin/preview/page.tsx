import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ client?: string }>;
}

export default async function AdminPreviewPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  await requireAdmin();

  if (!resolvedParams.client) {
    redirect("/admin/clients");
  }

  const supabase = await createServiceClient();
  const clientId = resolvedParams.client;

  // Fetch client data using service role
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) {
    redirect("/admin/clients");
  }

  // Fetch recent data for preview
  const [actionsRes, projectsRes, reportsRes, eventsRes] = await Promise.all([
    supabase.from("actions").select("*").eq("client_id", clientId).eq("visibility", "visible").order("action_date", { ascending: false }).limit(5),
    supabase.from("projects").select("*").eq("client_id", clientId).eq("visibility", "visible").order("created_at", { ascending: false }).limit(5),
    supabase.from("reports").select("*").eq("client_id", clientId).eq("visibility", "visible").order("published_at", { ascending: false }).limit(5),
    supabase.from("calendar_events").select("*").eq("client_id", clientId).eq("visibility", "visible").order("start_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Client Preview: {client.name}</h1>
          <p className="text-muted-foreground text-sm">
            읽기 전용 미리보기 (Admin Shadow View)
          </p>
        </div>
        <Badge variant="hold">Preview Mode</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">최근 Actions</CardTitle></CardHeader>
          <CardContent>
            {actionsRes.data && actionsRes.data.length > 0 ? (
              <div className="space-y-2">
                {actionsRes.data.map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <span className="text-sm">{a.title}</span>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">없음</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">프로젝트</CardTitle></CardHeader>
          <CardContent>
            {projectsRes.data && projectsRes.data.length > 0 ? (
              <div className="space-y-2">
                {projectsRes.data.map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-sm">{p.title}</span>
                    <span className="text-xs text-muted-foreground">{p.progress}%</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">없음</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">리포트</CardTitle></CardHeader>
          <CardContent>
            {reportsRes.data && reportsRes.data.length > 0 ? (
              <div className="space-y-2">
                {reportsRes.data.map(r => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="text-sm">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(r.published_at)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">없음</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">캘린더 이벤트</CardTitle></CardHeader>
          <CardContent>
            {eventsRes.data && eventsRes.data.length > 0 ? (
              <div className="space-y-2">
                {eventsRes.data.map(e => (
                  <div key={e.id} className="flex items-center justify-between">
                    <span className="text-sm">{e.title}</span>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">없음</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
