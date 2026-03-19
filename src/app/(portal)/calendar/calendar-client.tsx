"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarEvent } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { findServiceItem } from "@/lib/service-catalog";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CalendarDays,
  LayoutList,
  CheckCircle2,
  Clock,
  PauseCircle,
  FileBarChart2,
  BellRing,
  Sparkles,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  differenceInCalendarDays,
  isToday,
  isPast,
} from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type RelatedAction = {
  id: string;
  title: string;
  status: string;
  action_date: string;
  category: string | null;
};

interface CalendarClientProps {
  events: CalendarEvent[];
  relatedActions?: RelatedAction[];
  projectIdToTitle?: Record<string, string>;
  recentDone: Pick<CalendarEvent, "id" | "title" | "start_at" | "status">[];
  upcomingPlanned: Pick<CalendarEvent, "id" | "title" | "start_at" | "status">[];
  initialSelectedEventId?: string;
}

// ── 이벤트 타입별 스타일 정의 ─────────────────────────────────────────
const EVENT_STYLES: Record<
  string,
  { bg: string; pill: string; icon: React.ElementType; label: string }
> = {
  report: {
    bg: "bg-emerald-500",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-700",
    icon: FileBarChart2,
    label: "리포트",
  },
  notification: {
    bg: "bg-blue-500",
    pill: "bg-blue-50 border-blue-200 text-blue-700",
    icon: BellRing,
    label: "알림톡",
  },
  default: {
    bg: "bg-violet-500",
    pill: "bg-violet-50 border-violet-200 text-violet-700",
    icon: Sparkles,
    label: "일정",
  },
};

const STATUS_STYLES: Record<
  string,
  { dot: string; icon: React.ElementType; label: string }
> = {
  done: { dot: "bg-emerald-500", icon: CheckCircle2, label: "완료" },
  planned: { dot: "bg-blue-500", icon: Clock, label: "예정" },
  hold: { dot: "bg-amber-500", icon: PauseCircle, label: "보류" },
};

function getEventStyle(eventType: string) {
  return EVENT_STYLES[eventType] ?? EVENT_STYLES.default;
}

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.planned;
}

type ViewMode = "month" | "list";

export function CalendarClient({
  events,
  relatedActions = [],
  projectIdToTitle = {},
  recentDone,
  upcomingPlanned,
  initialSelectedEventId,
}: CalendarClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<ViewMode>("month");

  useEffect(() => {
    if (!initialSelectedEventId || events.length === 0) return;
    const event = events.find((e) => e.id === initialSelectedEventId);
    if (event) setSelectedEvent(event);
  }, [initialSelectedEventId, events]);

  // ── 월별 이벤트 필터 ──────────────────────────────────────────────
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      result.push(monthDays.slice(i, i + 7));
    }
    return result;
  }, [monthDays]);

  const eventsInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return events.filter((e) => {
      const s = startOfDay(new Date(e.start_at));
      const end = e.end_at ? endOfDay(new Date(e.end_at)) : s;
      return s <= monthEnd && end >= monthStart;
    });
  }, [events, currentDate]);

  // ── 이번 달 요약 통계 ─────────────────────────────────────────────
  const monthStats = useMemo(() => {
    const total = eventsInMonth.length;
    const done = eventsInMonth.filter((e) => e.status === "done").length;
    const planned = eventsInMonth.filter((e) => e.status === "planned").length;
    return { total, done, planned };
  }, [eventsInMonth]);

  // ── 멀티데이 바 계산 ──────────────────────────────────────────────
  type EventSegment = {
    event: CalendarEvent;
    startCol: number;
    endCol: number;
    continuesLeft: boolean;
    continuesRight: boolean;
    lane: number;
  };

  const getWeekSegments = (weekDaysSlice: Date[]): EventSegment[] => {
    const weekStart = startOfDay(weekDaysSlice[0]!);
    const weekEnd = endOfDay(weekDaysSlice[weekDaysSlice.length - 1]!);
    const segments: {
      event: CalendarEvent;
      startCol: number;
      endCol: number;
      continuesLeft: boolean;
      continuesRight: boolean;
    }[] = [];
    for (const e of events) {
      const eventStart = startOfDay(new Date(e.start_at));
      const eventEnd = e.end_at ? endOfDay(new Date(e.end_at)) : eventStart;
      if (eventEnd < weekStart || eventStart > weekEnd) continue;
      const startCol = Math.max(0, differenceInCalendarDays(eventStart, weekStart));
      const endCol = Math.min(6, differenceInCalendarDays(eventEnd, weekStart));
      segments.push({
        event: e,
        startCol,
        endCol,
        continuesLeft: eventStart < weekStart,
        continuesRight: eventEnd > weekEnd,
      });
    }
    segments.sort(
      (a, b) =>
        a.startCol - b.startCol ||
        b.endCol - b.startCol - (a.endCol - a.startCol)
    );
    const laneEnds: number[] = [];
    return segments.map((seg) => {
      let lane = 0;
      while (laneEnds[lane] !== undefined && laneEnds[lane]! > seg.startCol)
        lane++;
      laneEnds[lane] = seg.endCol + 1;
      return { ...seg, lane };
    });
  };

  const MAX_LANES = 3;

  // ── 리스트 뷰: 월 전체 이벤트를 날짜 기준 그룹 ───────────────────
  const listGroups = useMemo(() => {
    const sorted = [...eventsInMonth].sort(
      (a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    const groups: { label: string; date: Date; events: CalendarEvent[] }[] = [];
    for (const e of sorted) {
      const d = startOfDay(new Date(e.start_at));
      const label = format(d, "M월 d일 (E)", { locale: ko });
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.date, d)) {
        last.events.push(e);
      } else {
        groups.push({ label, date: d, events: [e] });
      }
    }
    return groups;
  }, [eventsInMonth]);

  const navigateRelatedWork = (event: CalendarEvent) => {
    if (event.related_action_ids && event.related_action_ids.length > 0) {
      const ids = event.related_action_ids.join(",");
      router.push(`/execution?ids=${ids}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 이번 달 요약 헤더 ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100/60">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground font-medium">이번 달 전체</p>
            <p className="text-2xl font-bold mt-0.5">{monthStats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">개 일정</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/60">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-emerald-700 font-medium">완료</p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{monthStats.done}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {monthStats.total > 0
                ? `${Math.round((monthStats.done / monthStats.total) * 100)}% 달성`
                : "항목 없음"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/60">
          <CardContent className="py-4 px-5">
            <p className="text-xs text-blue-700 font-medium">예정</p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">{monthStats.planned}</p>
            <p className="text-xs text-blue-600 mt-0.5">진행 예정</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 메인 캘린더 영역 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 캘린더 */}
        <div className="xl:col-span-3">
          <Card>
            <CardContent className="p-5">
              {/* 네비게이션 바 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-base font-semibold px-1 min-w-[100px] text-center">
                    {format(currentDate, "yyyy년 M월", { locale: ko })}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 ml-1"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    오늘
                  </Button>
                </div>
                {/* 뷰 토글 */}
                <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setView("month")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      view === "month"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />월
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      view === "list"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />목록
                  </button>
                </div>
              </div>

              {/* 월 뷰 */}
              {view === "month" && (
                <>
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 mb-1">
                    {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                      <div
                        key={d}
                        className={cn(
                          "text-center text-[11px] font-semibold py-2",
                          i === 0
                            ? "text-rose-500"
                            : i === 6
                            ? "text-blue-500"
                            : "text-muted-foreground"
                        )}
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* 주간 그리드 */}
                  <div className="space-y-px rounded-xl overflow-hidden border border-border/40">
                    {weeks.map((weekDaysSlice, weekIdx) => {
                      const segs = getWeekSegments(weekDaysSlice);
                      return (
                        <div
                          key={weekIdx}
                          className="grid grid-cols-7 gap-px bg-border/30"
                          style={{
                            gridTemplateRows: `auto repeat(${MAX_LANES}, minmax(20px, auto))`,
                          }}
                        >
                          {/* 날짜 헤더 */}
                          {weekDaysSlice.map((day, colIdx) => {
                            const inMonth = isSameMonth(day, currentDate);
                            const today = isToday(day);
                            return (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  "bg-card flex flex-col items-center pt-2 pb-1 min-h-[32px]",
                                  !inMonth && "bg-muted/20"
                                )}
                                style={{ gridRow: 1, gridColumn: colIdx + 1 }}
                              >
                                <span
                                  className={cn(
                                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                    today
                                      ? "bg-primary text-primary-foreground font-bold"
                                      : colIdx === 0
                                      ? inMonth ? "text-rose-500" : "text-rose-300"
                                      : colIdx === 6
                                      ? inMonth ? "text-blue-500" : "text-blue-300"
                                      : inMonth
                                      ? "text-foreground"
                                      : "text-muted-foreground/40"
                                  )}
                                >
                                  {format(day, "d")}
                                </span>
                              </div>
                            );
                          })}

                          {/* 빈 레인 배경 */}
                          {Array.from({ length: MAX_LANES }, (_, laneIdx) =>
                            weekDaysSlice.map((day, colIdx) => (
                              <div
                                key={`lane-${laneIdx}-${colIdx}`}
                                className={cn(
                                  "bg-card min-h-[20px]",
                                  !isSameMonth(day, currentDate) && "bg-muted/20"
                                )}
                                style={{
                                  gridRow: laneIdx + 2,
                                  gridColumn: colIdx + 1,
                                }}
                              />
                            ))
                          )}

                          {/* 이벤트 바 */}
                          {segs.map((seg) => {
                            const style = getEventStyle(seg.event.event_type);
                            const isDone = seg.event.status === "done";
                            const isOverdue =
                              seg.event.status === "planned" &&
                              isPast(endOfDay(new Date(seg.event.start_at)));
                            return (
                              <button
                                key={`${seg.event.id}-${weekIdx}-${seg.startCol}`}
                                type="button"
                                onClick={() => setSelectedEvent(seg.event)}
                                title={seg.event.title}
                                className={cn(
                                  "flex items-center min-h-[18px] w-full text-left text-white text-[10px] font-medium leading-tight px-1.5 py-0.5 rounded transition-all hover:brightness-90 active:scale-[0.98]",
                                  isDone
                                    ? "bg-emerald-500"
                                    : isOverdue
                                    ? "bg-rose-400"
                                    : style.bg,
                                  seg.continuesLeft
                                    ? "rounded-l-none pl-0.5"
                                    : "rounded-l",
                                  seg.continuesRight
                                    ? "rounded-r-none"
                                    : "rounded-r",
                                  initialSelectedEventId === seg.event.id &&
                                    "ring-2 ring-primary ring-offset-1"
                                )}
                                style={{
                                  gridRow: seg.lane + 2,
                                  gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                                }}
                              >
                                <span className="truncate">{seg.event.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* 범례 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-border/40">
                    {Object.entries(EVENT_STYLES).map(([key, val]) => {
                      const Icon = val.icon;
                      return (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn("h-2.5 w-2.5 rounded-sm", val.bg)} />
                          <Icon className="h-3 w-3" />
                          {val.label}
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                      기한 초과
                    </div>
                  </div>
                </>
              )}

              {/* 목록 뷰 */}
              {view === "list" && (
                <div className="space-y-6">
                  {listGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">이번 달 일정이 없습니다</p>
                    </div>
                  ) : (
                    listGroups.map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={cn(
                              "text-xs font-semibold px-2 py-1 rounded-md",
                              isToday(group.date)
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {group.label}
                            {isToday(group.date) && (
                              <span className="ml-1">· 오늘</span>
                            )}
                          </div>
                          <div className="flex-1 h-px bg-border/50" />
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {group.events.map((event) => {
                            const evStyle = getEventStyle(event.event_type);
                            const stStyle = getStatusStyle(event.status);
                            const Icon = evStyle.icon;
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => setSelectedEvent(event)}
                                className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                              >
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                                    evStyle.pill
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                      {event.title}
                                    </p>
                                  </div>
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0 mt-0.5">
                                  <StatusBadge status={event.status} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 사이드 패널 ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* 다가오는 일정 */}
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-xs font-semibold text-blue-700">다가오는 일정</p>
                {upcomingPlanned.length > 0 && (
                  <span className="ml-auto text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">
                    {upcomingPlanned.length}건
                  </span>
                )}
              </div>
              {upcomingPlanned.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  향후 14일 예정 없음
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingPlanned.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        const full = events.find((e) => e.id === ev.id);
                        if (full) setSelectedEvent(full);
                      }}
                      className="w-full text-left flex items-start gap-2.5 group py-1"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {ev.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(ev.start_at), "M월 d일 (E)", { locale: ko })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 완료 */}
          <Card>
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-700">최근 완료</p>
                {recentDone.length > 0 && (
                  <span className="ml-auto text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                    {recentDone.length}건
                  </span>
                )}
              </div>
              {recentDone.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  최근 14일 완료 없음
                </p>
              ) : (
                <div className="space-y-2">
                  {recentDone.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        const full = events.find((e) => e.id === ev.id);
                        if (full) setSelectedEvent(full);
                      }}
                      className="w-full text-left flex items-start gap-2.5 group py-1"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate group-hover:text-primary transition-colors line-through decoration-emerald-400/60">
                          {ev.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(ev.start_at), "M월 d일 (E)", { locale: ko })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 이벤트 상세 모달 ─────────────────────────────────────────── */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          {selectedEvent && (() => {
            const evStyle = getEventStyle(selectedEvent.event_type);
            const Icon = evStyle.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        evStyle.pill
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base leading-snug">
                        {selectedEvent.title}
                      </DialogTitle>
                      <DialogDescription className="mt-0.5">
                        {format(new Date(selectedEvent.start_at), "yyyy년 M월 d일 (E)", { locale: ko })}
                        {selectedEvent.end_at &&
                          selectedEvent.end_at !== selectedEvent.start_at &&
                          ` ~ ${format(new Date(selectedEvent.end_at), "M월 d일", { locale: ko })}`}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {/* 상태 + 타입 배지 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedEvent.status} />
                    <Badge
                      variant="outline"
                      className={cn("border text-xs", evStyle.pill)}
                    >
                      {evStyle.label}
                    </Badge>
                    {selectedEvent.related_action_ids &&
                      selectedEvent.related_action_ids.length > 0 &&
                      (() => {
                        const keys = new Set(
                          (selectedEvent.related_action_ids as string[]).flatMap(
                            (id) => {
                              const a = relatedActions.find((x) => x.id === id);
                              return (a?.category ?? "")
                                .split(",")
                                .map((c: string) => c.trim())
                                .filter(Boolean);
                            }
                          )
                        );
                        return Array.from(keys).map((k) => (
                          <Badge
                            key={k}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {k === "general"
                              ? "일반"
                              : (findServiceItem(k)?.label ??
                                k.replace(/_/g, " "))}
                          </Badge>
                        ));
                      })()}
                  </div>

                  {/* 설명 */}
                  {selectedEvent.description && (
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-sm whitespace-pre-wrap text-foreground/80">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {/* 관련 프로젝트 */}
                  {selectedEvent.project_id && (
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                      <div className="px-3 py-2 bg-muted/30 border-b border-border/40">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          관련 프로젝트
                        </p>
                      </div>
                      <Link
                        href={`/projects/${selectedEvent.project_id}`}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/40 transition-colors text-sm font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {projectIdToTitle[selectedEvent.project_id] ??
                          "프로젝트 보기"}
                      </Link>
                    </div>
                  )}

                  {/* 관련 실행 현황 */}
                  {selectedEvent.related_action_ids &&
                    selectedEvent.related_action_ids.length > 0 && (
                      <div className="rounded-xl border border-border/60 overflow-hidden">
                        <div className="px-3 py-2 bg-muted/30 border-b border-border/40">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            관련 실행 현황
                          </p>
                        </div>
                        <ul className="divide-y divide-border/40 max-h-44 overflow-y-auto">
                          {(selectedEvent.related_action_ids as string[])
                            .map((id) => relatedActions.find((a) => a.id === id))
                            .filter(Boolean)
                            .map((action) => {
                              const categoryKeys = (action!.category ?? "")
                                .split(",")
                                .map((c: string) => c.trim())
                                .filter(Boolean);
                              const categoryLabels = categoryKeys.map(
                                (k: string) =>
                                  k === "general"
                                    ? "일반"
                                    : (findServiceItem(k)?.label ??
                                      k.replace(/_/g, " "))
                              );
                              return (
                                <li key={action!.id}>
                                  <Link
                                    href={`/execution/actions/${action!.id}`}
                                    className="flex flex-col gap-1 py-2.5 px-3 hover:bg-muted/40 transition-colors text-sm"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate font-medium text-sm">
                                        {action!.title}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <StatusBadge status={action!.status} />
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatDate(action!.action_date)}
                                        </span>
                                      </div>
                                    </div>
                                    {categoryLabels.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {categoryLabels.map((label, i) => (
                                          <Badge
                                            key={i}
                                            variant="secondary"
                                            className="text-[10px] font-normal"
                                          >
                                            {label}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                        </ul>
                        <div className="px-3 py-2 border-t border-border/40">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => navigateRelatedWork(selectedEvent)}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            실행 현황에서 전체 보기
                          </Button>
                        </div>
                      </div>
                    )}
                </div>

                <DialogFooter />
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
