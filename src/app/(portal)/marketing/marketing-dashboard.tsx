"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick,
  DollarSign, Target, Users, Minus, Unplug, RefreshCw, CalendarDays,
} from "lucide-react";
import { MetricChart } from "@/components/charts/kpi-trend-chart";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Integration {
  id: string;
  platform: string;
  display_name: string;
  status: string;
  last_synced_at: string | null;
}

interface PlatformMetric {
  id: string;
  platform: string;
  metric_date: string;
  metric_key: string;
  metric_value: number;
}

interface Props {
  integrations: Integration[];
  metrics: PlatformMetric[];
  compareMetrics: PlatformMetric[];
  dateFrom: string;
  dateTo: string;
  compareFrom: string | null;
  compareTo: string | null;
  compareEnabled: boolean;
  selectedPlatform: string;
  monthlyBudget?: Record<string, number>;
}

const PLATFORM_LABEL: Record<string, string> = {
  naver_ads:        "네이버 검색광고",
  naver_searchad:   "네이버 검색광고",
  meta_ads:         "Meta Ads",
  google_ads:       "Google Ads",
  google_analytics: "Google Analytics",
};

const METRIC_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  format: (v: number) => string;
  color: string;
  isRate?: boolean;
}> = {
  impressions: { label: "노출수",   icon: Eye,               format: (v) => v.toLocaleString(),                   color: "text-blue-600" },
  clicks:      { label: "클릭수",   icon: MousePointerClick, format: (v) => v.toLocaleString(),                   color: "text-emerald-600" },
  cost:        { label: "비용",     icon: DollarSign,        format: (v) => `₩${v.toLocaleString()}`,             color: "text-amber-600" },
  conversions: { label: "전환수",   icon: Target,            format: (v) => v.toLocaleString(),                   color: "text-violet-600" },
  ctr:         { label: "클릭률",   icon: TrendingUp,        format: (v) => `${v.toFixed(2)}%`,                   color: "text-cyan-600",  isRate: true },
  cpc:         { label: "CPC",      icon: DollarSign,        format: (v) => `₩${Math.round(v).toLocaleString()}`, color: "text-rose-600",  isRate: true },
  sessions:    { label: "세션",     icon: Users,             format: (v) => v.toLocaleString(),                   color: "text-indigo-600" },
  users:       { label: "사용자",   icon: Users,             format: (v) => v.toLocaleString(),                   color: "text-teal-600" },
  reach:       { label: "도달",     icon: Users,             format: (v) => v.toLocaleString(),                   color: "text-pink-600" },
  pageviews:   { label: "페이지뷰", icon: Eye,               format: (v) => v.toLocaleString(),                   color: "text-orange-600" },
};

const METRIC_ORDER = ["impressions", "clicks", "cost", "conversions", "ctr", "cpc", "sessions", "users", "reach", "pageviews"];

function aggregateMetrics(metrics: PlatformMetric[], platform: string) {
  const groups: Record<string, number[]> = {};
  for (const m of metrics) {
    if (platform !== "all" && m.platform !== platform) continue;
    if (!groups[m.metric_key]) groups[m.metric_key] = [];
    groups[m.metric_key].push(m.metric_value);
  }
  return Object.fromEntries(
    Object.entries(groups).map(([key, vals]) => {
      const cfg = METRIC_CONFIG[key];
      const total = vals.reduce((a, b) => a + b, 0);
      return [key, cfg?.isRate ? total / vals.length : total];
    })
  );
}

function buildDailyTrend(metrics: PlatformMetric[], platform: string) {
  const byDate: Record<string, Record<string, number>> = {};
  for (const m of metrics) {
    if (platform !== "all" && m.platform !== platform) continue;
    if (!byDate[m.metric_date]) byDate[m.metric_date] = {};
    if (!byDate[m.metric_date][m.metric_key]) byDate[m.metric_date][m.metric_key] = 0;
    byDate[m.metric_date][m.metric_key] += m.metric_value;
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      dateLabel: `${date.slice(5, 7)}/${date.slice(8, 10)}`,
      ...vals,
    }));
}

function formatDateRange(from: string, to: string) {
  return `${format(new Date(from), "M/d", { locale: ko })} ~ ${format(new Date(to), "M/d", { locale: ko })}`;
}

function ChangeBadge({ current, previous }: { current: number | undefined; previous: number | undefined }) {
  if (current === undefined || previous === undefined || previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />0%
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export function MarketingDashboard({
  integrations, metrics, compareMetrics,
  dateFrom, dateTo, compareFrom, compareTo,
  compareEnabled: initialCompareEnabled,
  selectedPlatform: initialPlatform,
  monthlyBudget,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [platform, setPlatform] = useState(initialPlatform);
  const [compareEnabled, setCompareEnabled] = useState(initialCompareEnabled);
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);
  const [customCmpFrom, setCustomCmpFrom] = useState(compareFrom ?? "");
  const [customCmpTo, setCustomCmpTo] = useState(compareTo ?? "");
  const [customOpen, setCustomOpen] = useState(false);
  const [cmpCustomOpen, setCmpCustomOpen] = useState(false);

  function navigate(overrides: Record<string, string | null | undefined>) {
    const sp = new URLSearchParams();
    sp.set("from", overrides.from ?? dateFrom);
    sp.set("to",   overrides.to   ?? dateTo);
    if (overrides.compare === "false") {
      sp.set("compare", "false");
    } else {
      if (overrides.cFrom ?? compareFrom) sp.set("cFrom", overrides.cFrom ?? compareFrom ?? "");
      if (overrides.cTo   ?? compareTo)   sp.set("cTo",   overrides.cTo   ?? compareTo   ?? "");
    }
    const plt = overrides.platform ?? platform;
    if (plt !== "all") sp.set("platform", plt);
    startTransition(() => router.push(`/marketing?${sp.toString()}`));
  }

  function selectPreset(days: number) {
    const to   = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    navigate({ from, to });
  }

  const activeDays = useMemo(() => {
    const diff = Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000);
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateTo === todayStr && [7, 14, 30].includes(diff)) return diff;
    return "custom";
  }, [dateFrom, dateTo]);

  const lastSyncedAt = useMemo(() => {
    const dates = integrations.map((i) => i.last_synced_at).filter(Boolean) as string[];
    return dates.length ? dates.sort().reverse()[0] : null;
  }, [integrations]);

  const handleSync = async () => {
    setSyncLoading(true); setSyncMessage(null);
    try {
      const res = await fetch("/api/portal/integrations/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      setSyncMessage(res.ok ? (data.recordCount != null ? `동기화 완료. ${data.recordCount}건 수집됨` : "동기화 완료") : (data.error || "동기화 실패"));
      if (res.ok) router.refresh();
    } catch { setSyncMessage("동기화 요청 실패"); }
    finally { setSyncLoading(false); }
  };

  const currentAgg   = useMemo(() => aggregateMetrics(metrics,       platform), [metrics,       platform]);
  const compareAgg   = useMemo(() => aggregateMetrics(compareMetrics, platform), [compareMetrics, platform]);
  const currentTrend = useMemo(() => buildDailyTrend(metrics,        platform), [metrics,        platform]);
  const compareTrend = useMemo(() => buildDailyTrend(compareMetrics,  platform), [compareMetrics, platform]);

  const summaryCards = useMemo(() =>
    METRIC_ORDER
      .filter((k) => currentAgg[k] !== undefined)
      .map((key) => ({
        key,
        value:     currentAgg[key],
        prevValue: compareEnabled ? compareAgg[key] : undefined,
        config:    METRIC_CONFIG[key] ?? { label: key, icon: BarChart3, format: (v: number) => v.toLocaleString(), color: "text-gray-600" },
      })),
    [currentAgg, compareAgg, compareEnabled]
  );

  const uniquePlatforms = useMemo(() => [...new Set(metrics.map((m) => m.platform))], [metrics]);

  const platformComparison = useMemo(() => {
    const byPlatform: Record<string, Record<string, number>> = {};
    for (const m of metrics) {
      if (!byPlatform[m.platform]) byPlatform[m.platform] = {};
      if (!byPlatform[m.platform][m.metric_key]) byPlatform[m.platform][m.metric_key] = 0;
      byPlatform[m.platform][m.metric_key] += m.metric_value;
    }
    return Object.entries(byPlatform).map(([p, vals]) => ({ platform: p, label: PLATFORM_LABEL[p] ?? p, ...vals }));
  }, [metrics]);

  // 채널별 기여도 (2개 이상 플랫폼일 때만)
  const CHANNEL_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];
  const channelContribution = useMemo(() => {
    if (platformComparison.length < 2) return [];
    return (["cost", "clicks", "conversions", "impressions"] as const)
      .filter((k) => currentAgg[k] !== undefined && (currentAgg[k] ?? 0) > 0)
      .map((metricKey) => {
        const total = currentAgg[metricKey] ?? 0;
        const platforms = platformComparison
          .map((pc) => ({
            label: pc.label,
            value: (pc as Record<string, unknown>)[metricKey] as number ?? 0,
          }))
          .filter((p) => p.value > 0)
          .sort((a, b) => b.value - a.value);
        if (platforms.length === 0) return null;
        return { metricKey, label: METRIC_CONFIG[metricKey]?.label ?? metricKey, total, platforms };
      })
      .filter(Boolean) as { metricKey: string; label: string; total: number; platforms: { label: string; value: number }[] }[];
  }, [platformComparison, currentAgg]);

  // 예산 소진율: monthly_ad_budget vs 조회 기간 실제 비용
  const budgetConsumption = useMemo(() => {
    if (!monthlyBudget || Object.keys(monthlyBudget).length === 0) return [];
    // 플랫폼별 cost 합계
    const costByPlatform: Record<string, number> = {};
    for (const m of metrics) {
      if (m.metric_key !== "cost") continue;
      if (!costByPlatform[m.platform]) costByPlatform[m.platform] = 0;
      costByPlatform[m.platform] += m.metric_value;
    }
    return Object.entries(monthlyBudget)
      .filter(([, budget]) => budget > 0)
      .map(([platformKey, budget]) => {
        const spent = costByPlatform[platformKey] ?? 0;
        const pct = Math.min(Math.round((spent / budget) * 100), 999);
        const overBudget = spent > budget;
        return { platformKey, label: PLATFORM_LABEL[platformKey] ?? platformKey, budget, spent, pct, overBudget };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [monthlyBudget, metrics]);

  const comparePeriodLabel = compareFrom && compareTo ? formatDateRange(compareFrom, compareTo) : "비교";

  // ── 연동 없음 ──
  if (integrations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">광고 성과</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <Unplug className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">연결된 플랫폼이 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              관리자에게 문의하여 네이버, Meta Ads, Google Ads, GA4 등 마케팅 플랫폼을 연결해 주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">광고 성과</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {integrations.length}개 플랫폼 연결됨
            {lastSyncedAt && (
              <span className="ml-2">
                · 마지막 동기화: {new Date(lastSyncedAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncLoading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${syncLoading ? "animate-spin" : ""}`} />
          {syncLoading ? "동기화 중…" : "데이터 동기화"}
        </Button>
      </div>

      {syncMessage && <p className="text-xs text-muted-foreground">{syncMessage}</p>}

      {/* ── 기간 선택 패널 ── */}
      <Card className="border-border/50">
        <CardContent className="py-4 space-y-4">
          {/* 조회 기간 */}
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium w-16 shrink-0">조회 기간</span>

            {([7, 14, 30] as const).map((d) => (
              <button key={d} onClick={() => selectPreset(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  activeDays === d
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {d}일
              </button>
            ))}

            <button
              onClick={() => setCustomOpen((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                activeDays === "custom"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {activeDays === "custom" ? formatDateRange(dateFrom, dateTo) : "직접 입력"}
            </button>

            <div className="ml-auto">
              <Select value={platform} onValueChange={(v) => { setPlatform(v); navigate({ platform: v }); }}>
                <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 플랫폼</SelectItem>
                  {uniquePlatforms.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABEL[p] ?? p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 커스텀 기간 인라인 패널 */}
          {customOpen && (
            <div className="flex flex-wrap items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
              <span className="text-xs text-muted-foreground">조회 기간:</span>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs bg-background" />
              <span className="text-muted-foreground text-xs">~</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs bg-background" />
              <Button size="sm" className="h-7 text-xs" onClick={() => { navigate({ from: customFrom, to: customTo }); setCustomOpen(false); }}>
                적용
              </Button>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setCustomOpen(false)}>취소</button>
            </div>
          )}

          {/* 비교 기간 */}
          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            <button
              onClick={() => { const v = !compareEnabled; setCompareEnabled(v); navigate({ compare: v ? undefined : "false" }); }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${compareEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
              role="switch"
              aria-checked={compareEnabled}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${compareEnabled ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <span className="text-sm cursor-pointer" onClick={() => { const v = !compareEnabled; setCompareEnabled(v); navigate({ compare: v ? undefined : "false" }); }}>
              기간 비교
            </span>

            {compareEnabled && compareFrom && compareTo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>비교 기간:</span>
                <span className="font-medium text-foreground">{formatDateRange(compareFrom, compareTo)}</span>
                <button className="text-primary hover:underline" onClick={() => setCmpCustomOpen((v) => !v)}>변경</button>
              </div>
            )}
            {isPending && <span className="text-xs text-muted-foreground animate-pulse">로딩 중…</span>}
          </div>

          {/* 비교 기간 커스텀 인라인 패널 */}
          {compareEnabled && cmpCustomOpen && (
            <div className="flex flex-wrap items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
              <span className="text-xs text-muted-foreground">비교 기간:</span>
              <input type="date" value={customCmpFrom} onChange={(e) => setCustomCmpFrom(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs bg-background" />
              <span className="text-muted-foreground text-xs">~</span>
              <input type="date" value={customCmpTo} onChange={(e) => setCustomCmpTo(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs bg-background" />
              <Button size="sm" className="h-7 text-xs" onClick={() => { navigate({ cFrom: customCmpFrom, cTo: customCmpTo }); setCmpCustomOpen(false); }}>
                적용
              </Button>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setCmpCustomOpen(false)}>취소</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 플랫폼 뱃지 ── */}
      <div className="flex gap-2 flex-wrap">
        {integrations.map((integ) => (
          <Badge key={integ.id} variant="outline" className="px-3 py-1.5 gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {integ.display_name}
          </Badge>
        ))}
      </div>

      {/* ── 핵심 지표 카드 ── */}
      {summaryCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {summaryCards.map((card) => {
            const Icon = card.config.icon;
            return (
              <Card key={card.key} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/50">
                      <Icon className={`h-4 w-4 ${card.config.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{card.config.label}</span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{card.config.format(card.value)}</p>
                  {compareEnabled && (
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {card.prevValue !== undefined ? card.config.format(card.prevValue) : "—"}
                      </span>
                      <ChangeBadge current={card.value} previous={card.prevValue} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>선택한 기간에 수집된 데이터가 없습니다.</p>
            <p className="text-xs mt-1">상단 [데이터 동기화] 버튼을 눌러 최신 데이터를 가져오세요.</p>
          </CardContent>
        </Card>
      )}

      {/* ── C-1: 채널별 기여도 ── */}
      {channelContribution.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">채널별 기여도</h2>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="space-y-6">
                {channelContribution.map((item) => {
                  const cfg = METRIC_CONFIG[item.metricKey];
                  return (
                    <div key={item.metricKey}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className="text-sm font-bold tabular-nums">
                          {cfg?.format(item.total) ?? item.total.toLocaleString()}
                        </span>
                      </div>
                      {/* 스택 바 */}
                      <div className="flex h-7 rounded-lg overflow-hidden gap-0.5">
                        {item.platforms.map((p, i) => {
                          const pct = Math.round((p.value / item.total) * 100);
                          return (
                            <div
                              key={p.label}
                              className="h-full flex items-center justify-center text-[11px] text-white font-bold transition-all hover:opacity-90 cursor-default"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                                minWidth: pct > 0 ? "2px" : "0",
                              }}
                              title={`${p.label}: ${cfg?.format(p.value) ?? p.value.toLocaleString()} (${pct}%)`}
                            >
                              {pct >= 12 && `${pct}%`}
                            </div>
                          );
                        })}
                      </div>
                      {/* 범례 */}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {item.platforms.map((p, i) => {
                          const pct = Math.round((p.value / item.total) * 100);
                          return (
                            <div key={p.label} className="flex items-center gap-1.5">
                              <div
                                className="h-2.5 w-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {p.label}
                                <span className="ml-1 font-medium text-foreground">{pct}%</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 예산 소진율 ── */}
      {budgetConsumption.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">예산 소진율</h2>
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground mb-4">
                {formatDateRange(dateFrom, dateTo)} 기간 광고비 vs 월 예산
              </p>
              <div className="space-y-5">
                {budgetConsumption.map((item) => (
                  <div key={item.platformKey}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          ₩{item.spent.toLocaleString()} / ₩{item.budget.toLocaleString()}
                        </span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                          item.overBudget
                            ? "bg-rose-100 text-rose-700"
                            : item.pct >= 80
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {item.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.overBudget ? "bg-rose-500" : item.pct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 추이 차트 ── */}
      {currentTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentTrend.some((d) => (d as Record<string,unknown>).impressions || (d as Record<string,unknown>).clicks) && (
            <MetricChart title="노출수 / 클릭수 추이"
              data={currentTrend} compareData={compareEnabled ? compareTrend : undefined} comparePeriodLabel={comparePeriodLabel}
              metricKeys={[{ key: "impressions", label: "노출수", color: "#6366f1" }, { key: "clicks", label: "클릭수", color: "#10b981" }]}
              chartType="area"
            />
          )}
          {currentTrend.some((d) => (d as Record<string,unknown>).cost) && (
            <MetricChart title="비용 추이"
              data={currentTrend} compareData={compareEnabled ? compareTrend : undefined} comparePeriodLabel={comparePeriodLabel}
              metricKeys={[{ key: "cost", label: "비용(원)", color: "#f59e0b" }]}
              chartType="bar" valueFormatter={(v) => `₩${v.toLocaleString()}`}
            />
          )}
          {currentTrend.some((d) => (d as Record<string,unknown>).conversions) && (
            <MetricChart title="전환수 추이"
              data={currentTrend} compareData={compareEnabled ? compareTrend : undefined} comparePeriodLabel={comparePeriodLabel}
              metricKeys={[{ key: "conversions", label: "전환수", color: "#8b5cf6" }]}
              chartType="line"
            />
          )}
          {currentTrend.some((d) => (d as Record<string,unknown>).sessions || (d as Record<string,unknown>).users) && (
            <MetricChart title="트래픽 추이"
              data={currentTrend} compareData={compareEnabled ? compareTrend : undefined} comparePeriodLabel={comparePeriodLabel}
              metricKeys={[{ key: "sessions", label: "세션", color: "#06b6d4" }, { key: "users", label: "사용자", color: "#ec4899" }]}
              chartType="area"
            />
          )}
        </div>
      )}

      {/* ── 플랫폼별 비교 ── */}
      {platformComparison.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">플랫폼별 비교</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {platformComparison.map((pc) => (
              <Card key={pc.platform}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">{pc.label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(pc)
                      .filter(([k]) => !["platform", "label"].includes(k))
                      .slice(0, 6)
                      .map(([key, value]) => {
                        const cfg = METRIC_CONFIG[key];
                        if (!cfg) return null;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{cfg.label}</span>
                            <span className="text-sm font-medium tabular-nums">{cfg.format(value as unknown as number)}</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 일별 추이 테이블 ── */}
      {currentTrend.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">일별 추이</h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">날짜</th>
                    {summaryCards.slice(0, 5).map((card) => (
                      <th key={card.key} className="text-right p-3 font-medium">{card.config.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTrend.slice(-14).map((day, i) => (
                    <tr key={day.date} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="p-3 font-medium text-muted-foreground">{day.date}</td>
                      {summaryCards.slice(0, 5).map((card) => {
                        const val = (day as Record<string, unknown>)[card.key];
                        return (
                          <td key={card.key} className="text-right p-3 tabular-nums">
                            {val !== undefined
                              ? card.config.format(val as number)
                              : <Minus className="h-3 w-3 inline text-muted-foreground/40" />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
