"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Wallet, Target, MessageCircle, FileText, ChevronRight } from "lucide-react";
import type { Notification } from "@/lib/types/database";

const REPORT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  MON_REVIEW: { label: "지난주 리뷰", icon: BarChart3, color: "bg-blue-100 text-blue-700" },
  WED_BUDGET: { label: "예산 점검", icon: Wallet, color: "bg-emerald-100 text-emerald-700" },
  THU_PROPOSAL: { label: "제안 및 승인", icon: Target, color: "bg-violet-100 text-violet-700" },
};

function formatSentAt(sentAt: string): string {
  const d = new Date(sentAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

interface Props {
  notifications: Notification[];
  /** 오버뷰 등에서 최근 N건만 보여줄 때 사용. 없으면 전체 표시. */
  limit?: number;
  /** limit 사용 시 "타임라인 전체보기" 링크 표시 여부 (전용 페이지로 이동) */
  showViewAllLink?: boolean;
}

export function CareHistoryTimeline({ notifications, limit, showViewAllLink = false }: Props) {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );
  const displayList = limit != null ? sorted.slice(0, limit) : sorted;
  const hasMore = limit != null && sorted.length > limit;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          알림 히스토리
        </CardTitle>
        {showViewAllLink && (
          <Link
            href="/timeline"
            className="text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            전체보기 <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">아직 발송된 알림이 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1">
              주 3회(월/수/목) 성과 요약이 발송됩니다
            </p>
          </div>
        ) : (
          <div className="relative max-h-[400px] overflow-y-auto">
            {/* 세로선 */}
            <div
              className="absolute left-[15px] top-2 bottom-2 w-px bg-border"
              aria-hidden
            />
            <div className="space-y-0">
              {displayList.map((n) => {
                const config = REPORT_TYPE_CONFIG[n.report_type] ?? {
                  label: n.report_type,
                  icon: FileText,
                  color: "bg-muted text-muted-foreground",
                };
                const Icon = config.icon;
                return (
                  <Link
                    key={n.id}
                    href={`/report/v/${n.view_token}`}
                    className="relative flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    {/* 노드: 세로선 위의 점/아이콘 */}
                    <div
                      className={`relative z-10 shrink-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-background ${config.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatSentAt(n.sent_at)}
                        </span>
                        {n.report_type === "THU_PROPOSAL" && n.approval_status === "APPROVED" && (
                          <Badge variant="done" className="text-[10px]">승인됨</Badge>
                        )}
                      </div>
                      {n.ai_message && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 group-hover:text-foreground transition-colors">
                          {n.ai_message}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            {hasMore && showViewAllLink && (
              <div className="relative flex items-center gap-3 py-2 px-2 text-muted-foreground">
                <div className="relative z-10 shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center" />
                <p className="text-xs">
                  외 {sorted.length - (limit ?? 0)}건 · 위 "전체보기"에서 확인
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
