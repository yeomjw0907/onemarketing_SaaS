"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarEvent } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { findServiceItem } from "@/lib/service-catalog";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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
  addWeeks,
  subWeeks,
  differenceInCalendarDays,
  startOfWeek as sowFn,
  endOfWeek as eowFn,
} from "date-fns";
import { ko } from "date-fns/locale";

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

export function CalendarClient({ events, relatedActions = [], projectIdToTitle = {}, recentDone, upcomingPlanned, initialSelectedEventId }: CalendarClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<"month" | "week" | "list">("month");

  useEffect(() => {
    if (!initialSelectedEventId || events.length === 0) return;
    const event = events.find((e) => e.id === initialSelectedEventId);
    if (event) setSelectedEvent(event);
  }, [initialSelectedEventId, events]);

  // Month view days
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = sowFn(currentDate, { weekStartsOn: 0 });
    const end = eowFn(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Chunk days into weeks (7 days each)
  const weeks = useMemo(() => {
    const days = view === "month" ? monthDays : weekDays;
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [view, monthDays, weekDays]);

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
    const segments: { event: CalendarEvent; startCol: number; endCol: number; continuesLeft: boolean; continuesRight: boolean }[] = [];
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
    segments.sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));
    const laneEnds: number[] = [];
    const assigned: EventSegment[] = segments.map((seg) => {
      let lane = 0;
      while (laneEnds[lane] !== undefined && laneEnds[lane]! > seg.startCol) lane++;
      laneEnds[lane] = seg.endCol + 1;
      return { ...seg, lane };
    });
    return assigned;
  };

  const MAX_LANES = 3;

  const getEventsForDay = (day: Date) => {
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();
    return events.filter((e) => {
      const start = new Date(e.start_at).getTime();
      const end = e.end_at ? new Date(e.end_at).getTime() : start;
      return start <= dayEnd && end >= dayStart;
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-emerald-500";
      case "planned": return "bg-blue-500";
      case "hold": return "bg-amber-500";
      default: return "bg-gray-400";
    }
  };

  const navigateRelatedWork = (event: CalendarEvent) => {
    if (event.related_action_ids && event.related_action_ids.length > 0) {
      const ids = event.related_action_ids.join(",");
      router.push(`/execution?ids=${ids}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Calendar */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
                    else setCurrentDate(subWeeks(currentDate, 1));
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {format(currentDate, view === "month" ? "yyyy년 M월" : "yyyy년 M월 d일 주간", {
                    locale: ko,
                  })}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
                    else setCurrentDate(addWeeks(currentDate, 1));
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs"
                >
                  오늘
                </Button>
              </div>
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="month">월</TabsTrigger>
                  <TabsTrigger value="week">주</TabsTrigger>
                  <TabsTrigger value="list">목록</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {view === "list" ? (
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    등록된 이벤트가 없습니다.
                  </p>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-subtle"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${statusColor(event.status)}`} />
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(event.start_at)}
                            {event.end_at && ` ~ ${formatDate(event.end_at)}`}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={event.status} />
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Week rows with multi-day bars */}
                <div className="space-y-px bg-border rounded-lg overflow-hidden">
                  {weeks.map((weekDaysSlice, weekIdx) => {
                    const segs = getWeekSegments(weekDaysSlice);
                    return (
                      <div
                        key={weekIdx}
                        className="grid grid-cols-7 gap-px"
                        style={{
                          gridTemplateRows: `auto repeat(${MAX_LANES}, minmax(22px, 1fr))`,
                        }}
                      >
                        {weekDaysSlice.map((day, colIdx) => {
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          const isToday = isSameDay(day, new Date());
                          return (
                            <div
                              key={day.toISOString()}
                              data-date={format(day, "yyyy-MM-dd")}
                              className={`min-h-[28px] bg-card flex flex-col items-center justify-start p-0.5 ${
                                !isCurrentMonth && view === "month" ? "opacity-40" : ""
                              }`}
                              style={{ gridRow: 1, gridColumn: colIdx + 1 }}
                            >
                              <span
                                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                                  isToday ? "bg-primary text-primary-foreground" : ""
                                }`}
                              >
                                {format(day, "d")}
                              </span>
                            </div>
                          );
                        })}
                        {Array.from({ length: MAX_LANES }, (_, laneIdx) =>
                          weekDaysSlice.map((day, colIdx) => (
                            <div
                              key={`lane-${laneIdx}-${colIdx}`}
                              data-date={format(day, "yyyy-MM-dd")}
                              className="bg-card/50 min-h-[22px]"
                              style={{ gridRow: laneIdx + 2, gridColumn: colIdx + 1 }}
                            />
                          ))
                        )}
                        {segs.map((seg) => (
                          <button
                            key={`${seg.event.id}-${weekIdx}-${seg.startCol}`}
                            type="button"
                            onClick={() => setSelectedEvent(seg.event)}
                            className={`flex items-stretch rounded min-h-[20px] w-full text-left ${statusColor(
                              seg.event.status
                            )} text-white ${
                              seg.continuesLeft ? "rounded-l-none" : ""
                            } ${seg.continuesRight ? "rounded-r-none" : ""} ${
                              initialSelectedEventId === seg.event.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                            }`}
                            style={{
                              gridRow: seg.lane + 2,
                              gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                            }}
                          >
                            <span className="flex-1 text-[10px] leading-tight px-1 py-0.5 truncate min-w-0">
                              {seg.event.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">완료 (최근 14일)</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDone.length > 0 ? (
              <div className="space-y-2">
                {recentDone.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="flex-1 truncate text-xs">{ev.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">항목 없음</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">예정 (향후 14일)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPlanned.length > 0 ? (
              <div className="space-y-2">
                {upcomingPlanned.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="flex-1 truncate text-xs">{ev.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">항목 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedEvent.start_at)}
                  {selectedEvent.end_at && ` ~ ${formatDate(selectedEvent.end_at)}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedEvent.status} />
                  <Badge variant="outline">{selectedEvent.event_type}</Badge>
                  {selectedEvent.related_action_ids &&
                    selectedEvent.related_action_ids.length > 0 && (() => {
                      const keys = new Set(
                        (selectedEvent.related_action_ids as string[])
                          .flatMap((id) => {
                            const a = relatedActions.find((x) => x.id === id);
                            return (a?.category ?? "").split(",").map((c: string) => c.trim()).filter(Boolean);
                          })
                      );
                      return Array.from(keys).map((k) => (
                        <Badge key={k} variant="secondary" className="text-xs font-normal">
                          {k === "general" ? "일반" : (findServiceItem(k)?.label ?? k.replace(/_/g, " "))}
                        </Badge>
                      ));
                    })()}
                </div>
                {selectedEvent.description && (
                  <p className="text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                )}
                {selectedEvent.project_id && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">관련 프로젝트</p>
                    <Link
                      href={`/projects/${selectedEvent.project_id}`}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      {projectIdToTitle[selectedEvent.project_id] ?? "프로젝트 보기"}
                    </Link>
                  </div>
                )}
                {selectedEvent.related_action_ids && selectedEvent.related_action_ids.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">관련 실행 현황</p>
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                      {(selectedEvent.related_action_ids as string[])
                        .map((id) => relatedActions.find((a) => a.id === id))
                        .filter(Boolean)
                        .map((action) => {
                          const categoryKeys = (action!.category ?? "")
                            .split(",")
                            .map((c: string) => c.trim())
                            .filter(Boolean);
                          const categoryLabels = categoryKeys.map((k: string) =>
                            k === "general" ? "일반" : (findServiceItem(k)?.label ?? k.replace(/_/g, " "))
                          );
                          return (
                            <li key={action!.id}>
                              <Link
                                href={`/execution/actions/${action!.id}`}
                                className="flex flex-col gap-1 py-1.5 px-2 rounded-md hover:bg-muted text-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate font-medium">{action!.title}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <StatusBadge status={action!.status} />
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(action!.action_date)}
                                    </span>
                                  </div>
                                </div>
                                {categoryLabels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {categoryLabels.map((label, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px] font-normal">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => navigateRelatedWork(selectedEvent)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      실행 현황에서 전체 보기
                    </Button>
                  </div>
                )}
              </div>
              <DialogFooter />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
