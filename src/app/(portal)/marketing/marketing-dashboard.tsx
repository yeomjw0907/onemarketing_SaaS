"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart3, TrendingUp, TrendingDown, Eye, MousePointerClick,
  DollarSign, Target, Users, ArrowRight, Minus, Unplug, RefreshCw,
} from "lucide-react";
import { MetricChart } from "@/components/charts/kpi-trend-chart";

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
  dateFrom: string;
  dateTo: string;
}

const PLATFORM_LABEL: Record<string, string> = {
  naver_ads: "네이버 검색광고",
  naver_searchad: "네이버 검색광고",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  google_analytics: "Google Analytics",
};

const METRIC_CONFIG: Record<string, { label: string; icon: React.ElementType; format: (v: number) => string; color: string }> = {
  impressions: { label: "노출수", icon: Eye, format: (v) => v.toLocaleString(), color: "text-blue-600" },
  clicks: { label: "클릭수", icon: MousePointerClick, format: (v) => v.toLocaleString(), color: "text-emerald-600" },
  cost: { label: "비용", icon: DollarSign, format: (v) => `₩${v.toLocaleString()}`, color: "text-amber-600" },
  conversions: { label: "전환수", icon: Target, format: (v) => v.toLocaleString(), color: "text-violet-600" },
  ctr: { label: "클릭률", icon: TrendingUp, format: (v) => `${v.toFixed(2)}%`, color: "text-cyan-600" },
  cpc: { label: "CPC", icon: DollarSign, format: (v) => `₩${Math.round(v).toLocaleString()}`, color: "text-rose-600" },
  sessions: { label: "세션", icon: Users, format: (v) => v.toLocaleString(), color: "text-indigo-600" },
  users: { label: "사용자", icon: Users, format: (v) => v.toLocaleString(), color: "text-teal-600" },
  reach: { label: "도달", icon: Users, format: (v) => v.toLocaleString(), color: "text-pink-600" },
  pageviews: { label: "페이지뷰", icon: Eye, format: (v) => v.toLocaleString(), color: "text-orange-600" },
};

export function MarketingDashboard({ integrations, metrics, dateFrom, dateTo }: Props) {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const lastSyncedAt = useMemo(() => {
    const dates = integrations.map((i) => i.last_synced_at).filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.sort().reverse()[0];
  }, [integrations]);

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/portal/integrations/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.recordCount != null ? `동기화 완료. ${data.recordCount}건 수집됨` : "동기화 완료");
        router.refresh();
      } else {
        setSyncMessage(data.error || "동기화 실패");
      }
    } catch {
      setSyncMessage("동기화 요청 실패");
    } finally {
      setSyncLoading(false);
    }
  };

  // 날짜 범위에 따른 필터
  const filteredMetrics = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return metrics.filter(m => {
      const platformMatch = selectedPlatform === "all" || m.platform === selectedPlatform;
      const dateMatch = m.metric_date >= cutoff;
      return platformMatch && dateMatch;
    });
  }, [metrics, selectedPlatform, dateRange]);

  // 지표별 합계/평균 계산
  const summaryCards = useMemo(() => {
    const groups: Record<string, number[]> = {};
    for (const m of filteredMetrics) {
      if (!groups[m.metric_key]) groups[m.metric_key] = [];
      groups[m.metric_key].push(m.metric_value);
    }

    return Object.entries(groups).map(([key, values]) => {
      const isRateMetric = ["ctr", "bounce_rate", "cpc", "cpm"].includes(key);
      const total = values.reduce((a, b) => a + b, 0);
      const avg = total / values.length;

      return {
        key,
        value: isRateMetric ? avg : total,
        config: METRIC_CONFIG[key] || { label: key, icon: BarChart3, format: (v: number) => v.toLocaleString(), color: "text-gray-600" },
      };
    }).sort((a, b) => {
      const order = ["impressions", "clicks", "cost", "conversions", "ctr", "cpc", "sessions", "users", "reach", "pageviews"];
      return (order.indexOf(a.key) === -1 ? 99 : order.indexOf(a.key)) - (order.indexOf(b.key) === -1 ? 99 : order.indexOf(b.key));
    });
  }, [filteredMetrics]);

  // 일별 추이 데이터
  const dailyTrend = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    for (const m of filteredMetrics) {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = {};
      if (!byDate[m.metric_date][m.metric_key]) byDate[m.metric_date][m.metric_key] = 0;
      byDate[m.metric_date][m.metric_key] += m.metric_value;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({ date, ...metrics }));
  }, [filteredMetrics]);

  // 플랫폼별 비교
  const platformComparison = useMemo(() => {
    const byPlatform: Record<string, Record<string, number>> = {};
    for (const m of filteredMetrics) {
      if (!byPlatform[m.platform]) byPlatform[m.platform] = {};
      if (!byPlatform[m.platform][m.metric_key]) byPlatform[m.platform][m.metric_key] = 0;
      byPlatform[m.platform][m.metric_key] += m.metric_value;
    }
    return Object.entries(byPlatform).map(([platform, metrics]) => ({
      platform,
      label: PLATFORM_LABEL[platform] || platform,
      ...metrics,
    }));
  }, [filteredMetrics]);

  const uniquePlatforms = useMemo(() => {
    return [...new Set(metrics.map(m => m.platform))];
  }, [metrics]);

  if (integrations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">마케팅 성과</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <Unplug className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">연결된 플랫폼이 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              관리자에게 문의하여 네이버 검색광고, Meta Ads, Google Ads, GA4 등
              마케팅 플랫폼을 연결해주세요. 연결 후 성과 데이터를 이 대시보드에서 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">마케팅 성과</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {integrations.length}개 플랫폼 연결됨
            {lastSyncedAt && (
              <span className="ml-2">· 마지막 동기화: {new Date(lastSyncedAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncLoading}
            title="연동된 플랫폼 데이터 수동 동기화"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncLoading ? "animate-spin" : ""}`} />
            {syncLoading ? "동기화 중…" : "데이터 동기화"}
          </Button>
          {syncMessage && (
            <span className="text-xs text-muted-foreground">{syncMessage}</span>
          )}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">최근 7일</SelectItem>
              <SelectItem value="14">최근 14일</SelectItem>
              <SelectItem value="30">최근 30일</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 플랫폼</SelectItem>
              {uniquePlatforms.map(p => (
                <SelectItem key={p} value={p}>{PLATFORM_LABEL[p] || p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 연결된 플랫폼 */}
      <div className="flex gap-2 flex-wrap">
        {integrations.map(integ => (
          <Badge key={integ.id} variant="outline" className="px-3 py-1.5 gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {integ.display_name}
          </Badge>
        ))}
      </div>

      {/* 핵심 지표 카드 */}
      {summaryCards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {summaryCards.map(card => {
            const Icon = card.config.icon;
            return (
              <Card key={card.key} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-muted/50`}>
                      <Icon className={`h-4 w-4 ${card.config.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{card.config.label}</span>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{card.config.format(card.value)}</p>
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

      {/* ── 추이 차트 ── */}
      {dailyTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 노출/클릭 추이 */}
          {dailyTrend.some((d: any) => d.impressions || d.clicks) && (
            <MetricChart
              title="노출수 / 클릭수 추이"
              data={dailyTrend.map((d) => ({
                ...d,
                dateLabel: `${d.date.slice(5, 7)}/${d.date.slice(8, 10)}`,
              }))}
              metricKeys={[
                { key: "impressions", label: "노출수", color: "#6366f1" },
                { key: "clicks", label: "클릭수", color: "#10b981" },
              ]}
              chartType="area"
            />
          )}

          {/* 비용 추이 */}
          {dailyTrend.some((d: any) => d.cost) && (
            <MetricChart
              title="비용 추이"
              data={dailyTrend.map((d) => ({
                ...d,
                dateLabel: `${d.date.slice(5, 7)}/${d.date.slice(8, 10)}`,
              }))}
              metricKeys={[
                { key: "cost", label: "비용(원)", color: "#f59e0b" },
              ]}
              chartType="bar"
              valueFormatter={(v) => `₩${v.toLocaleString()}`}
            />
          )}

          {/* 전환수 추이 */}
          {dailyTrend.some((d: any) => d.conversions) && (
            <MetricChart
              title="전환수 추이"
              data={dailyTrend.map((d) => ({
                ...d,
                dateLabel: `${d.date.slice(5, 7)}/${d.date.slice(8, 10)}`,
              }))}
              metricKeys={[
                { key: "conversions", label: "전환수", color: "#8b5cf6" },
              ]}
              chartType="line"
            />
          )}

          {/* 세션/사용자 추이 (GA4) */}
          {dailyTrend.some((d: any) => d.sessions || d.users) && (
            <MetricChart
              title="트래픽 추이"
              data={dailyTrend.map((d) => ({
                ...d,
                dateLabel: `${d.date.slice(5, 7)}/${d.date.slice(8, 10)}`,
              }))}
              metricKeys={[
                { key: "sessions", label: "세션", color: "#06b6d4" },
                { key: "users", label: "사용자", color: "#ec4899" },
              ]}
              chartType="area"
            />
          )}
        </div>
      )}

      {/* 플랫폼별 비교 */}
      {platformComparison.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">플랫폼별 비교</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {platformComparison.map(pc => (
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

      {/* 일별 추이 테이블 */}
      {dailyTrend.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">일별 추이</h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">날짜</th>
                    {summaryCards.slice(0, 6).map(card => (
                      <th key={card.key} className="text-right p-3 font-medium">{card.config.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyTrend.slice(-14).map((day, i) => (
                    <tr key={day.date} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="p-3 font-medium text-muted-foreground">{day.date}</td>
                      {summaryCards.slice(0, 6).map(card => {
                        const val = (day as any)[card.key];
                        return (
                          <td key={card.key} className="text-right p-3 tabular-nums">
                            {val !== undefined ? card.config.format(val) : <Minus className="h-3 w-3 inline text-muted-foreground/40" />}
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
