"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, stripHtml, cn } from "@/lib/utils";
import { List, LayoutGrid, ChevronDown, ChevronUp, CheckCircle2, Loader, BarChart3 } from "lucide-react";
import { findServiceItem } from "@/lib/service-catalog";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

// 커스텀 도넛 툴팁
function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-medium">{item.name}</p>
      <p className="text-sm font-bold mt-0.5">{item.value}건</p>
    </div>
  );
}

export function ExecutionView({ actions, categoryLabelByKey }: Props) {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [collapsedOpen, setCollapsedOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // ── 이번 달 집계 ──
  const summaryStats = useMemo(() => {
    const n = new Date();
    const monthStart = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    const monthEnd = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const thisMonth = actions.filter((a) => {
      const d = (a.action_date ?? "").toString().slice(0, 10);
      return d >= monthStart && d <= monthEnd;
    });

    return {
      total: actions.length,
      done: actions.filter((a) => a.status === "done").length,
      inProgress: actions.filter((a) => a.status === "in_progress").length,
      thisMonthTotal: thisMonth.length,
      thisMonthDone: thisMonth.filter((a) => a.status === "done").length,
    };
  }, [actions]);

  // ── 카테고리별 분포 (도넛 차트용) ──
  const categoryDist = useMemo(() => {
    const map = new Map<string, { key: string; label: string; color: string; count: number }>();
    for (const action of actions) {
      const cats = (action.category ?? "").split(",").map((c: string) => c.trim()).filter(Boolean);
      const effectiveCats = cats.length ? cats : ["general"];
      for (const k of effectiveCats) {
        if (!map.has(k)) {
          map.set(k, {
            key: k,
            label: categoryLabelByKey[k] ?? (k === "general" ? "일반" : k.replace(/_/g, " ")),
            color: getCategoryColor(k),
            count: 0,
          });
        }
        map.get(k)!.count++;
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [actions, categoryLabelByKey]);

  // ── 칸반용 그룹화 ──
  const byStatus = Object.fromEntries(
    [...KANBAN_COLUMNS.map((c) => c.key), ...COLLAPSED_STATUSES].map((s) => [
      s,
      actions.filter((a) => a.status === s),
    ])
  );
  const collapsedActions = COLLAPSED_STATUSES.flatMap((s) => byStatus[s] ?? []);

  const donePct = summaryStats.total > 0
    ? Math.round((summaryStats.done / summaryStats.total) * 100)
    : 0;
  const thisMonthPct = summaryStats.thisMonthTotal > 0
    ? Math.round((summaryStats.thisMonthDone / summaryStats.thisMonthTotal) * 100)
    : 0;

  return (
    <div>
      {/* ── A-2: 요약 통계 ── */}
      {actions.length > 0 && (
        <Card className="border-border/50 shadow-sm mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 왼쪽: 3개 스탯 */}
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-600">{summaryStats.thisMonthDone}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">이번 달 완료</p>
                  {summaryStats.thisMonthTotal > 0 && (
                    <p className="text-[10px] text-emerald-600/70 mt-0.5">
                      ({thisMonthPct}%)
                    </p>
                  )}
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-2xl font-bold text-blue-600">{summaryStats.inProgress}</p>
                  <p className="text-[11px] text-blue-700 mt-0.5 font-medium">진행 중</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-2xl font-bold">{donePct}%</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">전체 완료율</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    ({summaryStats.done}/{summaryStats.total})
                  </p>
                </div>
              </div>

              {/* 오른쪽: 도넛 차트 (sm 이상에서만) */}
              {categoryDist.length > 1 && (
                <div className="hidden sm:flex flex-col items-center justify-center w-[180px]">
                  <ResponsiveContainer width={180} height={120}>
                    <PieChart>
                      <Pie
                        data={categoryDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={52}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="label"
                      >
                        {categoryDist.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-muted-foreground mt-1">업무 분류</p>
                </div>
              )}
            </div>

            {/* 모바일 카테고리 차트 토글 */}
            {categoryDist.length > 1 && (
              <div className="sm:hidden mt-3">
                <button
                  onClick={() => setShowChart((v) => !v)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    업무 분류 보기
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showChart ? "rotate-180" : ""}`} />
                </button>
                {showChart && (
                  <div className="mt-2">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={categoryDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="label"
                        >
                          {categoryDist.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<DonutTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span className="text-[11px] text-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* 카테고리 범례 (데스크탑) */}
            {categoryDist.length > 1 && (
              <div className="hidden sm:flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                {categoryDist.map((c) => (
                  <div key={c.key} className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {c.label} ({c.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 뷰 토글 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {summaryStats.inProgress > 0 && (
            <span className="inline-flex items-center gap-1">
              <Loader className="h-3 w-3 animate-spin text-blue-500" />
              진행 중 {summaryStats.inProgress}건
            </span>
          )}
          {summaryStats.thisMonthDone > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              이번 달 {summaryStats.thisMonthDone}건 완료
            </span>
          )}
        </div>
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

      {/* ── 카테고리 분포 (리스트뷰 하단, 카테고리 2개 이상) ── */}
      {view === "list" && categoryDist.length >= 2 && (
        <Card className="border-border/50 shadow-sm mt-4">
          <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              업무 분류
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {categoryDist.map((c) => {
                const pct = actions.length > 0 ? Math.round((c.count / actions.length) * 100) : 0;
                return (
                  <div key={c.key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 truncate shrink-0">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{c.count}건</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
