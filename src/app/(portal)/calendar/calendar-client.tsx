"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { formatDate, formatDateTime } from "@/lib/utils";
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
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek as sowFn,
  endOfWeek as eowFn,
} from "date-fns";
import { ko } from "date-fns/locale";

interface CalendarClientProps {
  events: CalendarEvent[];
  recentDone: Pick<CalendarEvent, "id" | "title" | "start_at" | "status">[];
  upcomingPlanned: Pick<CalendarEvent, "id" | "title" | "start_at" | "status">[];
}

export function CalendarClient({ events, recentDone, upcomingPlanned }: CalendarClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<"month" | "week" | "list">("month");

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

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => isSameDay(new Date(e.start_at), day));
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
                            {formatDateTime(event.start_at)}
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
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {(view === "month" ? monthDays : weekDays).map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[100px] bg-card p-1.5 ${
                          !isCurrentMonth && view === "month" ? "opacity-40" : ""
                        }`}
                      >
                        <div
                          className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${statusColor(
                                event.status
                              )} text-white`}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
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
                  {formatDateTime(selectedEvent.start_at)}
                  {selectedEvent.end_at && ` ~ ${formatDateTime(selectedEvent.end_at)}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedEvent.status} />
                  <Badge variant="outline">{selectedEvent.event_type}</Badge>
                </div>
                {selectedEvent.description && (
                  <p className="text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                )}
              </div>
              <DialogFooter>
                {selectedEvent.related_action_ids &&
                  selectedEvent.related_action_ids.length > 0 && (
                    <Button onClick={() => navigateRelatedWork(selectedEvent)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      관련 실행 내역 보기
                    </Button>
                  )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
