import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, stripHtml } from "@/lib/utils";
import Link from "next/link";
import { Zap } from "lucide-react";
import { findServiceItem } from "@/lib/service-catalog";
import { ExecutionCategoryFilter } from "./execution-category-filter";

export const metadata: Metadata = {
  title: "실행 현황 | Onecation",
  description: "마케팅 실행 내역 및 진행 상황",
};

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

  const categoryKeys = Array.from(
    new Set((allActions || []).map((a: { category: string }) => a.category).filter(Boolean))
  ) as string[];

  const categoriesWithInfo = categoryKeys.map((key) => {
    const item = findServiceItem(key);
    return {
      key,
      label: item?.label ?? key.replace(/_/g, " "),
      iconKey: item?.iconKey ?? "report",
      color: item?.color ?? "#64748b",
    };
  });

  const categoryLabelByKey: Record<string, string> = Object.fromEntries(
    categoriesWithInfo.map((c) => [c.key, c.label])
  );

  const currentCategory =
    resolvedParams.category && categoryKeys.includes(resolvedParams.category)
      ? resolvedParams.category
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6" /> 실행 현황
        </h1>
        <p className="text-muted-foreground text-sm mt-1">마케팅 실행 내역</p>
      </div>

      {categoriesWithInfo.length > 0 && (
        <ExecutionCategoryFilter
          categories={categoriesWithInfo}
          currentCategory={currentCategory}
          idsFilter={resolvedParams.ids ?? null}
        />
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
                      {stripHtml(action.title) || action.title}
                    </Link>
                    {action.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {stripHtml(action.description)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabelByKey[action.category] ?? action.category}
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
