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

  // Do not filter by category in DB; we filter in memory to support comma-separated categories
  const { data: rawActions } = await query;

  // Build category tabs from actions only: split comma-separated categories, then unique set
  const categoryKeys = Array.from(
    new Set(
      (rawActions || []).flatMap((a) =>
        (a.category ?? "")
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean)
      )
    )
  ).sort();

  const categoriesWithInfo = categoryKeys.map((key) => {
    const item = findServiceItem(key);
    const label =
      key === "general" ? "일반" : (item?.label ?? key.replace(/_/g, " "));
    return {
      key,
      label,
      iconKey: item?.iconKey ?? "report",
      color: item?.color ?? "#64748b",
    };
  });

  const categoryLabelByKey: Record<string, string> = Object.fromEntries(
    categoriesWithInfo.map((c) => [c.key, c.label])
  );

  // Filter by category in memory (supports comma-separated category on each action)
  const actions =
    resolvedParams.category && categoryKeys.includes(resolvedParams.category)
      ? (rawActions || []).filter((action) => {
          const parts = (action.category ?? "")
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean);
          return parts.includes(resolvedParams.category!);
        })
      : rawActions ?? [];

  const currentCategory =
    resolvedParams.category && categoryKeys.includes(resolvedParams.category)
      ? resolvedParams.category
      : null;

  // 진척도: 목표가 있는 카테고리만 현재/목표 계산 (이번 달 또는 이번 주)
  const executionTargets = session.client?.execution_targets ?? {};
  const now = new Date();
  const progressByCategory: Record<
    string,
    { current: number; target: number; periodLabel: string }
  > = {};
  for (const key of categoryKeys) {
    const entry = executionTargets[key];
    if (!entry || typeof entry.target !== "number" || entry.target <= 0)
      continue;
    const period = entry.period === "weekly" ? "weekly" : "monthly";
    let periodStart: string;
    let periodEnd: string;
    let periodLabel: string;
    if (period === "monthly") {
      const y = now.getFullYear();
      const m = now.getMonth();
      periodStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      periodEnd = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      periodLabel = "이번 달";
    } else {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const mon = new Date(now);
      mon.setDate(now.getDate() + diff);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      periodStart = mon.toISOString().slice(0, 10);
      periodEnd = sun.toISOString().slice(0, 10);
      periodLabel = "이번 주";
    }
    const current = (rawActions || []).filter((a) => {
      const date = (a.action_date ?? "").toString().slice(0, 10);
      if (date < periodStart || date > periodEnd) return false;
      const parts = (a.category ?? "")
        .split(",")
        .map((c: string) => c.trim())
        .filter(Boolean);
      return parts.includes(key);
    }).length;
    progressByCategory[key] = {
      current,
      target: entry.target,
      periodLabel,
    };
  }

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
          progressByCategory={Object.keys(progressByCategory).length > 0 ? progressByCategory : undefined}
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
              <Link href={`/execution/actions/${action.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <CardContent className="py-4 px-6 cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-medium">
                        {stripHtml(action.title) || action.title}
                      </span>
                      {action.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {stripHtml(action.description)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {((action.category ?? "")
                          .split(",")
                          .map((c: string) => c.trim())
                          .filter(Boolean).length
                          ? (action.category ?? "").split(",").map((c: string) => c.trim()).filter(Boolean)
                          : ["general"]
                        ).map((k: string) => (
                          <Badge key={k} variant="outline" className="text-xs">
                            {categoryLabelByKey[k] ?? (k === "general" ? "일반" : k.replace(/_/g, " "))}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(action.action_date)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="실행 내역 없음" description="등록된 액션이 없습니다." />
      )}
    </div>
  );
}
