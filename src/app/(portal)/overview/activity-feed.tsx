"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  FileText,
  CheckCircle2,
  CalendarCheck,
  Activity,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export type ActivityItemType = "notification" | "report" | "action_done" | "calendar";

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  title: string;
  description?: string | null;
  timestamp: string;
  href?: string;
}

const TYPE_CONFIG: Record<
  ActivityItemType,
  { icon: typeof Activity; bgColor: string; iconColor: string; label: string }
> = {
  notification: {
    icon: MessageCircle,
    bgColor: "bg-sky-100",
    iconColor: "text-sky-600",
    label: "알림톡",
  },
  report: {
    icon: FileText,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    label: "리포트",
  },
  action_done: {
    icon: CheckCircle2,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "실행 완료",
  },
  calendar: {
    icon: CalendarCheck,
    bgColor: "bg-violet-100",
    iconColor: "text-violet-600",
    label: "일정 완료",
  },
};

function formatTimeAgo(timestamp: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const INITIAL_COUNT = 8;

interface Props {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: Props) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const displayList = showAll ? sorted : sorted.slice(0, INITIAL_COUNT);
  const hiddenCount = sorted.length - INITIAL_COUNT;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5" />
          </div>
          최근 활동
        </CardTitle>
        {sorted.length > 0 && (
          <span className="text-xs text-muted-foreground">{sorted.length}건</span>
        )}
      </CardHeader>

      <CardContent>
        {sorted.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">아직 활동 기록이 없습니다</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              리포트 발행, 실행 완료 등이 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* 세로 타임라인 선 */}
            <div
              className="absolute left-[15px] top-3 bottom-3 w-px bg-border/70"
              aria-hidden
            />

            <div className="space-y-0">
              {displayList.map((item) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;

                const inner = (
                  <div className="relative flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer">
                    {/* 타임라인 아이콘 노드 */}
                    <div
                      className={`relative z-10 shrink-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm ${config.bgColor} ${config.iconColor}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* 타입 + 시간 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${config.bgColor} ${config.iconColor}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                      {/* 제목 */}
                      <p className="text-sm font-medium mt-0.5 line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      {/* 설명 */}
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {item.href && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                    )}
                  </div>
                );

                return item.href ? (
                  <Link key={item.id} href={item.href} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={item.id}>{inner}</div>
                );
              })}
            </div>

            {/* 더 보기 / 접기 버튼 */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2.5 rounded-lg hover:bg-muted/50"
              >
                {showAll ? "접기" : `${hiddenCount}건 더 보기`}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
