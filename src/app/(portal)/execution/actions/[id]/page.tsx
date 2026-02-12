import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
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

  const links = Array.isArray(action.links) ? action.links : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/execution">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{action.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline">{action.category}</Badge>
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
            <p className="text-sm whitespace-pre-wrap">{action.description}</p>
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
