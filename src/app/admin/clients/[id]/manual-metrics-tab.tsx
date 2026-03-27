"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── 타입 ──
type ChannelType = "EXPERIENTIAL" | "SEO" | "BLOG" | "INFLUENCER" | "OTHER";

interface ExperientialMetrics {
  participants: number;
  completed: number;
  blog_posts: number;
  insta_posts: number;
  total_views: number;
  cost: number;
}

interface SeoMetrics {
  target_keywords: number;
  top1_count: number;
  top3_count: number;
  new_posts: number;
  main_keyword: string;
  main_rank: number;
  prev_rank: number;
}

interface ManualMetric {
  id: string;
  client_id: string;
  channel_type: ChannelType;
  channel_name: string;
  period_start: string;
  period_end: string;
  metrics: ExperientialMetrics | SeoMetrics | Record<string, unknown>;
  memo: string;
}

interface Props {
  clientId: string;
}

// ── 채널 타입 목록 ──
const CHANNEL_TYPES: { value: ChannelType; label: string }[] = [
  { value: "EXPERIENTIAL", label: "체험단" },
  { value: "SEO", label: "상위노출" },
  { value: "BLOG", label: "블로그" },
  { value: "INFLUENCER", label: "인플루언서" },
  { value: "OTHER", label: "기타" },
];

// ── 기본 폼 초기값 ──
const defaultExperiential: ExperientialMetrics = {
  participants: 0,
  completed: 0,
  blog_posts: 0,
  insta_posts: 0,
  total_views: 0,
  cost: 0,
};

const defaultSeo: SeoMetrics = {
  target_keywords: 0,
  top1_count: 0,
  top3_count: 0,
  new_posts: 0,
  main_keyword: "",
  main_rank: 0,
  prev_rank: 0,
};

// ── 수치 요약 생성 ──
function summarizeMetric(item: ManualMetric): string {
  if (item.channel_type === "EXPERIENTIAL") {
    const m = item.metrics as ExperientialMetrics;
    return `참여 ${m.participants ?? 0}명 · 조회수 ${(m.total_views ?? 0).toLocaleString()} · 비용 ${(m.cost ?? 0).toLocaleString()}원`;
  }
  if (item.channel_type === "SEO") {
    const m = item.metrics as SeoMetrics;
    return `키워드 ${m.target_keywords ?? 0}개 · 1위 ${m.top1_count ?? 0}건 · 주요키워드 "${m.main_keyword ?? ""}" ${m.main_rank ?? 0}위`;
  }
  return "";
}

// ── 날짜 포맷 ──
function formatPeriod(start: string, end: string): string {
  if (!start || !end) return "";
  return `${start} ~ ${end}`;
}

export function ManualMetricsTab({ clientId }: Props) {
  const [activeChannel, setActiveChannel] = useState<ChannelType>("EXPERIENTIAL");
  const [items, setItems] = useState<ManualMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── 체험단 폼 상태 ──
  const [channelName, setChannelName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [memo, setMemo] = useState("");
  const [expForm, setExpForm] = useState<ExperientialMetrics>(defaultExperiential);
  const [seoForm, setSeoForm] = useState<SeoMetrics>(defaultSeo);

  // ── 데이터 불러오기 ──
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/admin/clients/${clientId}/manual-metrics`);
        if (!res.ok) throw new Error("조회 실패");
        const data = await res.json();
        setItems(data.items ?? []);
      } catch {
        toast.error("수기 입력 데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [clientId]);

  // ── 폼 초기화 ──
  function resetForm() {
    setChannelName("");
    setPeriodStart("");
    setPeriodEnd("");
    setMemo("");
    setExpForm(defaultExperiential);
    setSeoForm(defaultSeo);
  }

  // ── 저장 ──
  async function handleSave() {
    if (!periodStart || !periodEnd) {
      toast.error("기간을 입력해 주세요.");
      return;
    }
    if (activeChannel === "EXPERIENTIAL" && !channelName.trim()) {
      toast.error("플랫폼명을 입력해 주세요.");
      return;
    }

    const metrics = activeChannel === "EXPERIENTIAL" ? expForm : activeChannel === "SEO" ? seoForm : {};

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/manual-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: activeChannel,
          channel_name: channelName,
          period_start: periodStart,
          period_end: periodEnd,
          metrics,
          memo,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems((prev) => [data.item, ...prev]);
      resetForm();
      toast.success("저장됐습니다.");
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ── 삭제 ──
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/manual-metrics`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("삭제됐습니다.");
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
      {/* ── 입력 카드 ── */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-1">수기 성과 입력</h3>
            <p className="text-xs text-muted-foreground mb-4">
              외부 채널(체험단, 상위노출 등)의 성과 데이터를 직접 입력합니다.
            </p>

            {/* 채널 타입 탭 */}
            <div className="flex gap-1.5 flex-wrap mb-5">
              {CHANNEL_TYPES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setActiveChannel(c.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    activeChannel === c.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* 공통 필드 */}
            <div className="space-y-4">
              {/* 플랫폼명 (체험단만) */}
              {activeChannel === "EXPERIENTIAL" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">플랫폼명</Label>
                  <Input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="레뷰, 마담잇수다 등"
                    className="h-8 text-sm"
                  />
                </div>
              )}

              {/* 기간 */}
              <div className="space-y-1.5">
                <Label className="text-xs">기간</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">~</span>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                </div>
              </div>

              {/* 체험단 전용 필드 */}
              {activeChannel === "EXPERIENTIAL" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">진행 인원</Label>
                      <Input
                        type="number"
                        min={0}
                        value={expForm.participants || ""}
                        onChange={(e) => setExpForm((f) => ({ ...f, participants: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">완료 인원</Label>
                      <Input
                        type="number"
                        min={0}
                        value={expForm.completed || ""}
                        onChange={(e) => setExpForm((f) => ({ ...f, completed: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">블로그 포스팅 수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={expForm.blog_posts || ""}
                        onChange={(e) => setExpForm((f) => ({ ...f, blog_posts: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">인스타 포스팅 수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={expForm.insta_posts || ""}
                        onChange={(e) => setExpForm((f) => ({ ...f, insta_posts: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">총 조회수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={expForm.total_views || ""}
                        onChange={(e) => setExpForm((f) => ({ ...f, total_views: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">집행 비용 (원)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={expForm.cost || ""}
                        onChange={(e) => setExpForm((f) => ({ ...f, cost: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 상위노출 전용 필드 */}
              {activeChannel === "SEO" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">타겟 키워드 수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={seoForm.target_keywords || ""}
                        onChange={(e) => setSeoForm((f) => ({ ...f, target_keywords: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">1위 달성 수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={seoForm.top1_count || ""}
                        onChange={(e) => setSeoForm((f) => ({ ...f, top1_count: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">3위 이내 수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={seoForm.top3_count || ""}
                        onChange={(e) => setSeoForm((f) => ({ ...f, top3_count: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">신규 포스팅 수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={seoForm.new_posts || ""}
                        onChange={(e) => setSeoForm((f) => ({ ...f, new_posts: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">주요 키워드</Label>
                    <Input
                      value={seoForm.main_keyword}
                      onChange={(e) => setSeoForm((f) => ({ ...f, main_keyword: e.target.value }))}
                      placeholder="강남 헬스장"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">현재 순위</Label>
                      <Input
                        type="number"
                        min={0}
                        value={seoForm.main_rank || ""}
                        onChange={(e) => setSeoForm((f) => ({ ...f, main_rank: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">전주 순위</Label>
                      <Input
                        type="number"
                        min={0}
                        value={seoForm.prev_rank || ""}
                        onChange={(e) => setSeoForm((f) => ({ ...f, prev_rank: Number(e.target.value) }))}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 메모 */}
              <div className="space-y-1.5">
                <Label className="text-xs">메모</Label>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="특이사항, 비고 등"
                  className="text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* 저장 버튼 */}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 저장된 목록 ── */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">입력 목록</h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              저장된 데이터가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const channelLabel = CHANNEL_TYPES.find((c) => c.value === item.channel_type)?.label ?? item.channel_type;
                const summary = summarizeMetric(item);
                const period = formatPeriod(item.period_start, item.period_end);

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between px-3.5 py-3 rounded-xl bg-muted/40 border border-border/60 gap-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {channelLabel}
                        </Badge>
                        {item.channel_name && (
                          <span className="text-xs font-medium text-foreground">
                            {item.channel_name}
                          </span>
                        )}
                        {period && (
                          <span className="text-xs text-muted-foreground">{period}</span>
                        )}
                      </div>
                      {summary && (
                        <p className="text-xs text-muted-foreground truncate">{summary}</p>
                      )}
                      {item.memo && (
                        <p className="text-xs text-muted-foreground/70 truncate">{item.memo}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
