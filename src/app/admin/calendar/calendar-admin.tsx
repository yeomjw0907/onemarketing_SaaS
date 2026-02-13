"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EventStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDateTime, cn } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Pencil, X, CalendarDays } from "lucide-react";

interface Props {
  initialEvents: any[];
  clients: { id: string; name: string; client_code: string }[];
}

// 클라이언트별 색상
const CLIENT_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  "bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-orange-500",
  "bg-lime-500", "bg-indigo-500", "bg-teal-500", "bg-red-500",
];
const CLIENT_LIGHT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-violet-50 border-violet-200 text-violet-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-lime-50 border-lime-200 text-lime-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
  "bg-teal-50 border-teal-200 text-teal-800",
  "bg-red-50 border-red-200 text-red-800",
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const STATUS_LABEL: Record<string, string> = { planned: "계획됨", done: "완료", hold: "보류" };

export function CalendarAdmin({ initialEvents, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterClient, setFilterClient] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // 편집 폼
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [eventType, setEventType] = useState("task");
  const [status, setStatus] = useState<EventStatus>("planned");

  // 클라이언트 → 색상 매핑
  const clientColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach((c, i) => { map[c.id] = i % CLIENT_COLORS.length; });
    return map;
  }, [clients]);

  const clientNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [clients]);

  // 필터링
  const filteredEvents = useMemo(() =>
    filterClient === "all"
      ? initialEvents
      : initialEvents.filter((e: any) => e.client_id === filterClient),
    [initialEvents, filterClient]);

  // ── 달력 데이터 계산 ──
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=일
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // 이전 달 패딩
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    // 현재 달
    for (let d = 1; d <= totalDays; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // 다음 달 패딩 (6주 채우기)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // 날짜별 이벤트 매핑
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const ev of filteredEvents) {
      if (!ev.start_at) continue;
      const dateKey = ev.start_at.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    }
    return map;
  }, [filteredEvents]);

  const today = new Date().toISOString().slice(0, 10);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // 날짜 클릭
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
    setSelectedEvent(null);
  };

  // 이벤트 상세 보기
  const handleEventClick = (ev: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(ev);
  };

  // 이벤트 추가/수정
  const openCreate = (dateStr?: string) => {
    setEditing(null);
    setClientId(clients[0]?.id || "");
    setTitle("");
    setDescription("");
    setStartAt(dateStr ? `${dateStr}T09:00` : "");
    setEndAt("");
    setEventType("task");
    setStatus("planned");
    setEditDialogOpen(true);
  };

  const openEdit = (ev: any) => {
    setEditing(ev);
    setClientId(ev.client_id);
    setTitle(ev.title);
    setDescription(ev.description || "");
    setStartAt(ev.start_at?.slice(0, 16) || "");
    setEndAt(ev.end_at?.slice(0, 16) || "");
    setEventType(ev.event_type || "task");
    setStatus(ev.status);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        title,
        description: description || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        event_type: eventType,
        status,
      };
      if (editing) {
        await supabase.from("calendar_events").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("calendar_events").insert({
          ...payload,
          client_id: clientId,
          visibility: "visible",
          created_by: user.id,
          related_action_ids: [],
        });
      }
      setEditDialogOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  // 선택된 날짜의 이벤트
  const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-4">
      {/* ── 상단 컨트롤 ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9" aria-label="이전 달">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold min-w-[140px] text-center">
            {year}년 {month + 1}월
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9" aria-label="다음 달">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">
            오늘
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="전체 클라이언트" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 클라이언트</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-1" /> 추가
          </Button>
        </div>
      </div>

      {/* ── 클라이언트 범례 ── */}
      <div className="flex flex-wrap gap-2">
        {clients.slice(0, 8).map((c) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <div className={cn("h-2.5 w-2.5 rounded-full", CLIENT_COLORS[clientColorMap[c.id]])} />
            <span className="text-[11px] text-muted-foreground">{c.name}</span>
          </div>
        ))}
        {clients.length > 8 && (
          <span className="text-[11px] text-muted-foreground">+{clients.length - 8}개</span>
        )}
      </div>

      {/* ── 달력 그리드 ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center py-2 text-xs font-semibold",
                  i === 0 && "text-rose-500",
                  i === 6 && "text-blue-500",
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = date.toISOString().slice(0, 10);
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const dayNum = date.getDate();
              const dayOfWeek = date.getDay();

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors",
                    !isCurrentMonth && "bg-muted/20",
                    isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                    isToday && "bg-blue-50/50",
                    "hover:bg-muted/30",
                  )}
                  onClick={() => handleDateClick(dateStr)}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                        !isCurrentMonth && "text-muted-foreground/40",
                        isToday && "bg-primary text-primary-foreground",
                        dayOfWeek === 0 && isCurrentMonth && !isToday && "text-rose-500",
                        dayOfWeek === 6 && isCurrentMonth && !isToday && "text-blue-500",
                      )}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-muted-foreground mr-0.5">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* 이벤트 목록 */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev: any) => {
                      const cIdx = clientColorMap[ev.client_id] ?? 0;
                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "text-[10px] md:text-[11px] leading-tight px-1.5 py-0.5 rounded-md border truncate cursor-pointer",
                            CLIENT_LIGHT_COLORS[cIdx],
                            ev.status === "done" && "line-through opacity-60",
                          )}
                          onClick={(e) => handleEventClick(ev, e)}
                          title={`[${clientNameMap[ev.client_id]}] ${ev.title}`}
                        >
                          <span className="hidden md:inline font-medium">
                            {clientNameMap[ev.client_id]?.slice(0, 4)}
                          </span>
                          <span className="hidden md:inline"> · </span>
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        +{dayEvents.length - 3}건
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 선택한 날짜의 이벤트 상세 ── */}
      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                📅 {selectedDate} 일정 ({selectedDateEvents.length}건)
              </h3>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openCreate(selectedDate)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> 이 날짜에 추가
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedDate(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">이 날짜에 일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((ev: any) => {
                  const cIdx = clientColorMap[ev.client_id] ?? 0;
                  return (
                    <div
                      key={ev.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedEvent?.id === ev.id
                          ? "ring-2 ring-primary/30 bg-primary/5"
                          : "hover:bg-muted/30",
                      )}
                      onClick={(e) => handleEventClick(ev, e)}
                    >
                      <div className={cn("h-3 w-3 rounded-full mt-1 shrink-0", CLIENT_COLORS[cIdx])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{ev.title}</span>
                          <StatusBadge status={ev.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">{clientNameMap[ev.client_id] || "?"}</span>
                          <span>{formatDateTime(ev.start_at)}</span>
                          {ev.end_at && <span>~ {formatDateTime(ev.end_at)}</span>}
                          {ev.event_type && <Badge variant="outline" className="text-[10px]">{ev.event_type}</Badge>}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{ev.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(ev); }} aria-label="이벤트 수정">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 이벤트 추가/수정 다이얼로그 ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "이벤트 수정" : "이벤트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>클라이언트 *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시작 *</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종료</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>일정 타입</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue placeholder="타입 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">작업</SelectItem>
                    <SelectItem value="meeting">미팅</SelectItem>
                    <SelectItem value="deadline">마감일</SelectItem>
                    <SelectItem value="milestone">마일스톤</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">계획됨</SelectItem>
                    <SelectItem value="done">완료</SelectItem>
                    <SelectItem value="hold">보류</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">취소</Button>
            <Button onClick={handleSave} disabled={loading || !title || !startAt} className="w-full sm:w-auto">
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
