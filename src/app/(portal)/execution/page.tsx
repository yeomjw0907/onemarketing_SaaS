import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Zap } from "lucide-react";

interface Props {
  searchParams: Promise<{ ids?: string; category?: string }>;
}

export default async function ExecutionPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "execution")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  let query = supabase
    .from("actions")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("action_date", { ascending: false });

  // Filter by ids if provided
  if (resolvedParams.ids) {
    const ids = resolvedParams.ids.split(",").filter(Boolean);
    if (ids.length > 0) {
      query = query.in("id", ids);
    }
  }

  // Filter by category if provided
  if (resolvedParams.category) {
    query = query.eq("category", resolvedParams.category);
  }

  const { data: actions } = await query;

  // Get unique categories for filter
  const { data: allActions } = await supabase
    .from("actions")
    .select("category")
    .eq("client_id", clientId)
    .eq("visibility", "visible");

  const categories = Array.from(new Set((allActions || []).map((a: { category: string }) => a.category)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" /> Execution
        </h1>
        <p className="text-muted-foreground text-sm mt-1">마케팅 실행 내역</p>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Link href="/execution">
            <Badge
              variant={!resolvedParams.category ? "default" : "outline"}
              className="cursor-pointer"
            >
              전체
            </Badge>
          </Link>
          {categories.map((cat) => (
            <Link key={cat} href={`/execution?category=${encodeURIComponent(cat)}`}>
              <Badge
                variant={resolvedParams.category === cat ? "default" : "outline"}
                className="cursor-pointer"
              >
                {cat}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {resolvedParams.ids && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">필터: 관련 액션 {resolvedParams.ids.split(",").length}건</Badge>
          <Link href="/execution" className="text-xs text-primary hover:underline">
            필터 해제
          </Link>
        </div>
      )}

      {actions && actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((action) => (
            <Card key={action.id} className="transition-subtle hover:shadow-md">
              <CardContent className="py-4 px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/execution/actions/${action.id}`}
                      className="text-base font-medium hover:underline"
                    >
                      {action.title}
                    </Link>
                    {action.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {action.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {action.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(action.action_date)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={action.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="실행 내역 없음" description="등록된 액션이 없습니다." />
      )}
    </div>
  );
}
