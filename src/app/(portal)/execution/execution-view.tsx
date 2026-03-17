"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, stripHtml, cn } from "@/lib/utils";
import { List, LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";
import { findServiceItem } from "@/lib/service-catalog";

interface Action {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  action_date: string;
  category?: string | null;
}

interface Props {
  actions: Action[];
  categoryLabelByKey: Record<string, string>;
}

// 상태별 칸반 컬럼 정의
const KANBAN_COLUMNS = [
  { key: "planned",     label: "진행 예정", color: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-400" },
  { key: "in_progress", label: "진행 중",   color: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-500" },
  { key: "done",        label: "완료",      color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
] as const;

const COLLAPSED_STATUSES = ["paused", "cancelled"];
const COLLAPSED_LABEL: Record<string, string> = { paused: "보류", cancelled: "취소" };

function getCategoryColor(categoryKey: string): string {
  const item = findServiceItem(categoryKey);
  return item?.color ?? "#64748b";
}

function KanbanCard({ action, categoryLabelByKey }: { action: Action; categoryLabelByKey: Record<string, string> }) {
  const categories = (action.category ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  return (
    <Link href={`/execution/actions/${action.id}`}>
      <div className="bg-card border border-border/60 rounded-xl p-3.5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {stripHtml(action.title) || action.title}
        </p>
        {action.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {stripHtml(action.description)}
          </p>
        )}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <div className="flex flex-wrap gap-1">
            {(categories.length ? categories : ["general"]).slice(0, 2).map((k) => (
              <span
                key={k}
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{
                  backgroundColor: `${getCategoryColor(k)}18`,
                  color: getCategoryColor(k),
                }}
              >
                {categoryLabelByKey[k] ?? (k === "general" ? "일반" : k)}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(action.action_date)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ExecutionView({ actions, categoryLabelByKey }: Props) {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [collapsedOpen, setCollapsedOpen] = useState(false);

  // ── 칸반용 그룹화 ──
  const byStatus = Object.fromEntries(
    [...KANBAN_COLUMNS.map((c) => c.key), ...COLLAPSED_STATUSES].map((s) => [
      s,
      actions.filter((a) => a.status === s),
    ])
  );
  const collapsedActions = COLLAPSED_STATUSES.flatMap((s) => byStatus[s] ?? []);

  return (
    <div>
      {/* ── 뷰 토글 ── */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors",
              view === "list"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-3.5 w-3.5" />
            리스트
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors",
              view === "kanban"
                ? "bg-background shadow-sm text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            칸반
          </button>
        </div>
      </div>

      {/* ── 리스트 뷰 ── */}
      {view === "list" && (
        <div className="space-y-3">
          {actions.length > 0 ? (
            actions.map((action) => {
              const cats = (action.category ?? "").split(",").map((c) => c.trim()).filter(Boolean);
              return (
                <Card key={action.id} className="transition-subtle hover:shadow-md">
                  <Link href={`/execution/actions/${action.id}`} className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <CardContent className="py-4 px-6 cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-medium">{stripHtml(action.title) || action.title}</span>
                          {action.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stripHtml(action.description)}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {(cats.length ? cats : ["general"]).map((k) => (
                              <Badge key={k} variant="outline" className="text-xs">
                                {categoryLabelByKey[k] ?? (k === "general" ? "일반" : k)}
                              </Badge>
                            ))}
                            <span className="text-xs text-muted-foreground">{formatDate(action.action_date)}</span>
                          </div>
                        </div>
                        <StatusBadge status={action.status} />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
              등록된 실행 항목이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* ── 칸반 뷰 ── */}
      {view === "kanban" && (
        <div className="space-y-4">
          {/* 3개 메인 컬럼 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:overflow-x-auto">
            {KANBAN_COLUMNS.map((col) => {
              const colActions = byStatus[col.key] ?? [];
              return (
                <div key={col.key} className="flex flex-col min-w-[260px]">
                  {/* 컬럼 헤더 */}
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border mb-3", col.color)}>
                    <div className={cn("h-2 w-2 rounded-full shrink-0", col.dot)} />
                    <span className="text-xs font-semibold">{col.label}</span>
                    <span className="ml-auto text-xs opacity-70">{colActions.length}</span>
                  </div>
                  {/* 카드 목록 */}
                  <div className="space-y-2 flex-1">
                    {colActions.length > 0 ? (
                      colActions.map((action) => (
                        <KanbanCard key={action.id} action={action} categoryLabelByKey={categoryLabelByKey} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                        항목 없음
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 보류/취소 접기 섹션 */}
          {collapsedActions.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setCollapsedOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">보류 / 취소</span>
                  <Badge variant="secondary" className="text-xs">{collapsedActions.length}</Badge>
                </span>
                {collapsedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {collapsedOpen && (
                <div className="border-t p-3 space-y-2 bg-muted/10">
                  {COLLAPSED_STATUSES.map((status) => {
                    const statusActions = byStatus[status] ?? [];
                    if (statusActions.length === 0) return null;
                    return (
                      <div key={status}>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">{COLLAPSED_LABEL[status]}</p>
                        <div className="space-y-2">
                          {statusActions.map((action) => (
                            <KanbanCard key={action.id} action={action} categoryLabelByKey={categoryLabelByKey} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
