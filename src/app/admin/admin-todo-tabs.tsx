"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CalendarDays,
  Bell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Inbox,
} from "lucide-react";

type CalendarEventItem = {
  id: string;
  title: string;
  start_at: string;
  client_id: string | null;
};

type PendingApproval = {
  id: string;
  client_id: string | null;
  report_type: string;
  sent_at: string;
  view_token: string | null;
};

interface AdminTodoTabsProps {
  todayEvents: CalendarEventItem[];
  weekEvents: CalendarEventItem[];
  pendingApprovals: PendingApproval[];
  clientNameById: Record<string, string>;
}

type Tab = "today" | "week" | "approvals";

function relativeDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "오늘";
  if (isTomorrow(d)) return "내일";
  return format(d, "M월 d일 (E)", { locale: ko });
}

function EmptySlot({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
        <Inbox className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function AdminTodoTabs({
  todayEvents,
  weekEvents,
  pendingApprovals,
  clientNameById,
}: AdminTodoTabsProps) {
  const [tab, setTab] = useState<Tab>("today");

  const tabs: { key: Tab; label: string; count: number; icon: React.ElementType; color: string }[] = [
    {
      key: "today",
      label: "오늘",
      count: todayEvents.length,
      icon: CalendarDays,
      color: "text-violet-600",
    },
    {
      key: "week",
      label: "이번 주",
      count: weekEvents.length,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      key: "approvals",
      label: "승인 대기",
      count: pendingApprovals.length,
      icon: Bell,
      color: "text-amber-600",
    },
  ];

  return (
    <div>
      {/* 탭 헤더 */}
      <div className="flex items-center gap-1 mb-4 border-b border-border/60">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? t.color : "")} />
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="min-h-[120px]">
        {/* 오늘 */}
        {tab === "today" && (
          <>
            {todayEvents.length === 0 ? (
              <EmptySlot message="오늘 예정된 일정이 없습니다" />
            ) : (
              <div className="space-y-1">
                {todayEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/admin/clients/${ev.client_id}`}
                  >
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors group -mx-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-violet-400 shrink-0 animate-pulse" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {clientNameById[ev.client_id ?? ""] ?? ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge variant="secondary" className="text-[10px]">오늘</Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* 이번 주 */}
        {tab === "week" && (
          <>
            {weekEvents.length === 0 ? (
              <EmptySlot message="이번 주 예정 일정이 없습니다" />
            ) : (
              <div className="space-y-1">
                {weekEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/admin/clients/${ev.client_id}`}
                  >
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors group -mx-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {clientNameById[ev.client_id ?? ""] ?? ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {relativeDay(ev.start_at)}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* 승인 대기 */}
        {tab === "approvals" && (
          <>
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-xs text-muted-foreground">대기 중인 제안서가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-1">
                {pendingApprovals.map((pa) => (
                  <Link key={pa.id} href={`/report/v/${pa.view_token}`}>
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-amber-50/60 transition-colors group -mx-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-amber-700 transition-colors">
                            {clientNameById[pa.client_id ?? ""] ?? "알 수 없음"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(pa.sent_at).toLocaleDateString("ko-KR", {
                              month: "long",
                              day: "numeric",
                            })} 발송
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                          승인 대기
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
