"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Save, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── 상수 ──
const DAYS = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 0, label: "일" },
];

const TEMPLATE_TYPES = [
  { value: "PERFORMANCE", label: "📊 성과 리포트", desc: "지난주 광고 성과" },
  { value: "BUDGET", label: "💰 예산 현황", desc: "이번달 소진율" },
  { value: "PROPOSAL", label: "🎯 운영 제안", desc: "다음주 제안 + 승인" },
];

const MAX_SCHEDULES = 3;

// ── 타입 ──
interface Schedule {
  id: string;
  client_id: string;
  day_of_week: number;
  template_type: "PERFORMANCE" | "BUDGET" | "PROPOSAL";
  is_active: boolean;
}

interface NotificationHistory {
  id: string;
  created_at: string;
  template_type: string;
  status: string;
  phone: string;
}

// ── 알림톡 미리보기 콘텐츠 ──
const PREVIEW_CONTENT = {
  PERFORMANCE: {
    title: "지난주 성과 리포트",
    body: (name: string) =>
      `안녕하세요, ${name}님.\n지난주 광고 성과를 안내드립니다.\n\n[AI 요약 내용]\n예) 클릭률 8.2% 달성, 전환 12건, 소진률 94%`,
    buttons: [{ label: "자세히 보기", style: "primary" }],
  },
  BUDGET: {
    title: "이번달 예산 현황",
    body: (name: string) =>
      `안녕하세요, ${name}님.\n이번달 광고 예산 현황입니다.\n\n[AI 요약 내용]\n예) 예산 68% 소진, 잔여 약 320만원`,
    buttons: [{ label: "자세히 보기", style: "primary" }],
  },
  PROPOSAL: {
    title: "다음주 운영 제안",
    body: (name: string) =>
      `안녕하세요, ${name}님.\n다음주 광고 운영 제안입니다.\n\n[AI 요약 내용]\n예) 키워드 확대 + 소재 교체 제안`,
    buttons: [
      { label: "자세히 보기", style: "secondary" },
      { label: "승인하기", style: "primary" },
    ],
  },
} as const;

interface Props {
  clientId: string;
  clientName?: string;
}

// ── 전화번호 마스킹 ──
function maskPhone(phone: string): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-****-$3");
  }
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}

// ── 날짜 포맷 ──
function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day} ${h}:${min}`;
  } catch {
    return dateStr;
  }
}

export function AlimtalkScheduleTab({ clientId, clientName = "고객명" }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewType, setPreviewType] = useState<"PERFORMANCE" | "BUDGET" | "PROPOSAL">("PERFORMANCE");

  // 선택 중인 요일 → templateType 매핑 (미저장 상태)
  const [pendingSelections, setPendingSelections] = useState<
    Record<number, "PERFORMANCE" | "BUDGET" | "PROPOSAL" | "">
  >({});

  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── 스케줄 불러오기 ──
  useEffect(() => {
    async function fetchSchedules() {
      try {
        const res = await fetch(`/api/admin/clients/${clientId}/schedule`);
        if (!res.ok) throw new Error("스케줄 조회 실패");
        const data = await res.json();
        setSchedules(data.schedules ?? []);
      } catch (err) {
        toast.error("스케줄 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, [clientId]);

  // ── 발송 이력 불러오기 ──
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(
          `/api/admin/notifications?clientId=${clientId}&type=alimtalk&limit=10`
        );
        if (!res.ok) throw new Error("이력 조회 실패");
        const data = await res.json();
        setHistory(data.notifications ?? data ?? []);
      } catch {
        // 발송 이력은 선택적 — 실패해도 조용히 처리
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [clientId]);

  // ── 이미 저장된 요일 집합 ──
  const savedDays = new Set(schedules.map((s) => s.day_of_week));

  // ── 현재 활성화된(선택된) 요일 집합: 저장된 것 + 새로 선택한 것 ──
  const activeDays = new Set([
    ...Array.from(savedDays),
    ...Object.keys(pendingSelections).map(Number),
  ]);

  // ── 요일 토글 ──
  function toggleDay(day: number) {
    // 이미 저장된 요일은 토글 불가 (삭제 버튼 따로 있음)
    if (savedDays.has(day)) return;

    setPendingSelections((prev) => {
      if (day in prev) {
        // 선택 해제
        const next = { ...prev };
        delete next[day];
        return next;
      }

      // 최대 3개 확인 (저장된 + pending 합산)
      const totalAfter = savedDays.size + Object.keys(prev).length + 1;
      if (totalAfter > MAX_SCHEDULES) {
        toast.error("최대 3회까지 설정 가능합니다.");
        return prev;
      }
      return { ...prev, [day]: "" };
    });
  }

  // ── 저장 ──
  async function handleSave() {
    // 템플릿 타입 미선택 확인
    const incomplete = Object.entries(pendingSelections).filter(
      ([, t]) => !t
    );
    if (incomplete.length > 0) {
      toast.error("선택한 요일의 템플릿 타입을 지정해 주세요.");
      return;
    }
    if (Object.keys(pendingSelections).length === 0) {
      toast.error("추가할 요일을 먼저 선택해 주세요.");
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all(
        Object.entries(pendingSelections).map(([day, templateType]) =>
          fetch(`/api/admin/clients/${clientId}/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              day_of_week: Number(day),
              template_type: templateType,
            }),
          })
        )
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length}건 저장에 실패했습니다.`);
      } else {
        toast.success("알림톡 스케줄이 저장됐습니다.");
        // 새로 저장된 것들 반영
        const newSchedules: Schedule[] = [];
        for (const [dayStr, templateType] of Object.entries(pendingSelections)) {
          const day = Number(dayStr);
          newSchedules.push({
            id: crypto.randomUUID(),
            client_id: clientId,
            day_of_week: day,
            template_type: templateType as Schedule["template_type"],
            is_active: true,
          });
        }
        setSchedules((prev) => [...prev, ...newSchedules]);
        setPendingSelections({});
      }
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 삭제 ──
  async function handleDelete(dayOfWeek: number) {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/schedule`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_of_week: dayOfWeek }),
      });
      if (!res.ok) throw new Error();
      setSchedules((prev) => prev.filter((s) => s.day_of_week !== dayOfWeek));
      toast.success("스케줄이 삭제됐습니다.");
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 요일 선택 카드 ── */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-1">알림톡 발송 요일</h3>
            <p className="text-xs text-muted-foreground mb-4">
              최대 3개 요일을 선택하고 각 요일에 발송할 템플릿을 지정하세요.
            </p>

            {/* 요일 버튼 */}
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => {
                const isSaved = savedDays.has(d.value);
                const isPending = d.value in pendingSelections;
                const isActive = isSaved || isPending;

                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    disabled={isSaved}
                    className={cn(
                      "w-10 h-10 rounded-xl text-sm font-medium transition-colors border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                      isSaved && "cursor-default opacity-90"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 저장된 스케줄 목록 */}
          {schedules.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">저장된 스케줄</p>
              {schedules.map((s) => {
                const day = DAYS.find((d) => d.value === s.day_of_week);
                const tmpl = TEMPLATE_TYPES.find((t) => t.value === s.template_type);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {day?.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{tmpl?.label}</p>
                        <p className="text-xs text-muted-foreground">{tmpl?.desc}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(s.day_of_week)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 새로 선택한 요일의 템플릿 타입 드롭다운 */}
          {Object.keys(pendingSelections).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">새 스케줄 설정</p>
              {Object.entries(pendingSelections).map(([dayStr, templateType]) => {
                const dayNum = Number(dayStr);
                const day = DAYS.find((d) => d.value === dayNum);
                return (
                  <div
                    key={dayStr}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20"
                  >
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                      {day?.label}
                    </span>
                    <Select
                      value={templateType}
                      onValueChange={(val) =>
                        setPendingSelections((prev) => ({
                          ...prev,
                          [dayNum]: val as Schedule["template_type"],
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue placeholder="템플릿 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="font-medium">{t.label}</span>
                            <span className="text-muted-foreground text-xs ml-1">
                              — {t.desc}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() =>
                        setPendingSelections((prev) => {
                          const next = { ...prev };
                          delete next[dayNum];
                          return next;
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 저장 버튼 */}
          {Object.keys(pendingSelections).length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              저장
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── 알림톡 미리보기 카드 ── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">알림톡 미리보기</h3>
            <span className="text-xs text-muted-foreground">— 실제 발송 시 AI가 생성한 내용으로 채워집니다</span>
          </div>

          {/* 템플릿 타입 탭 */}
          <div className="flex gap-1.5 flex-wrap">
            {TEMPLATE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setPreviewType(t.value as typeof previewType)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  previewType === t.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 카카오톡 알림톡 버블 */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              {/* 폰 느낌 배경 */}
              <div className="rounded-2xl bg-[#B2C7D9] p-4 shadow-inner">
                {/* 상단 채널 정보 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-[10px] font-black text-[#3A1D1D]">원</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-800">원마케팅</p>
                    <p className="text-[9px] text-gray-500">카카오 알림톡</p>
                  </div>
                </div>

                {/* 메시지 버블 */}
                <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
                  {/* 템플릿 헤더 */}
                  <div className="bg-[#FEE500] px-4 py-2.5">
                    <p className="text-xs font-bold text-[#3A1D1D]">
                      {PREVIEW_CONTENT[previewType].title}
                    </p>
                  </div>

                  {/* 메시지 본문 */}
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-gray-800 whitespace-pre-line leading-relaxed">
                      {PREVIEW_CONTENT[previewType].body(clientName)}
                    </p>
                  </div>

                  {/* 구분선 */}
                  <div className="mx-4 border-t border-gray-100" />

                  {/* 버튼 영역 */}
                  <div className={cn(
                    "grid divide-x divide-gray-100",
                    PREVIEW_CONTENT[previewType].buttons.length === 2 ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    {PREVIEW_CONTENT[previewType].buttons.map((btn) => (
                      <button
                        key={btn.label}
                        disabled
                        className={cn(
                          "py-2.5 text-[12px] font-semibold transition-colors",
                          btn.style === "primary"
                            ? "text-[#3A1D1D]"
                            : "text-gray-500"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 발송 시간 표시 */}
                <p className="text-[10px] text-gray-500 mt-2 text-right">오전 9:00</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 발송 이력 카드 ── */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">발송 이력</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              발송 이력이 없습니다.
            </p>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">발송 일시</TableHead>
                    <TableHead className="text-xs">템플릿</TableHead>
                    <TableHead className="text-xs">상태</TableHead>
                    <TableHead className="text-xs">수신 번호</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => {
                    const tmpl = TEMPLATE_TYPES.find((t) => t.value === h.template_type);
                    const isSuccess = h.status === "success" || h.status === "SUCCESS";
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(h.created_at)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {tmpl?.label ?? h.template_type}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isSuccess ? "default" : "destructive"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {isSuccess ? "성공" : "실패"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {maskPhone(h.phone)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
