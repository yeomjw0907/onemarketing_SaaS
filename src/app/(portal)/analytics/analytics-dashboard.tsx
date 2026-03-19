"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointerClick, Users, ArrowRightLeft, TrendingDown } from "lucide-react";
import { CombinedMetricsChart } from "@/components/analytics/combined-metrics-chart";
import { LandingPageTable } from "@/components/analytics/landing-page-table";
import type { CombinedMetric } from "@/lib/types/database";

type DateRange = 7 | 30 | 90;

interface PageStat {
  pagePath: string;
  totalSessions: number;
  totalUsers?: number;
  totalPageviews?: number;
  avgBounceRate: number;
  avgScrollDepth90: number;
  avgSessionDuration: number;
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/50">
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{title}</span>
        </div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [days, setDays] = useState<DateRange>(30);
  const [combinedData, setCombinedData] = useState<CombinedMetric[]>([]);
  const [pages, setPages] = useState<PageStat[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingPages, setLoadingPages] = useState(true);

  const { from, to } = useMemo(() => {
    const now = new Date();
    return {
      to: toDateStr(now),
      from: toDateStr(new Date(now.getTime() - days * 86400_000)),
    };
  }, [days]);

  useEffect(() => {
    setLoadingMetrics(true);
    fetch(`/api/portal/combined-metrics?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((json) => {
        setCombinedData(json.data ?? []);
      })
      .catch(() => setCombinedData([]))
      .finally(() => setLoadingMetrics(false));
  }, [from, to]);

  useEffect(() => {
    setLoadingPages(true);
    fetch(`/api/portal/ga4/pages?from=${from}&to=${to}&limit=20`)
      .then((r) => r.json())
      .then((json) => {
        setPages(json.data ?? []);
      })
      .catch(() => setPages([]))
      .finally(() => setLoadingPages(false));
  }, [from, to]);

  // KPI 집계
  const kpi = useMemo(() => {
    let totalClicks = 0;
    let totalSessions = 0;
    let bounceRateSum = 0;
    let bounceRateCount = 0;

    for (const d of combinedData) {
      if (d.clicks !== undefined) totalClicks += d.clicks;
      if (d.sessions !== undefined) totalSessions += d.sessions;
      if (d.bounce_rate !== undefined) {
        bounceRateSum += d.bounce_rate;
        bounceRateCount += 1;
      }
    }

    const avgBounceRate = bounceRateCount > 0 ? bounceRateSum / bounceRateCount : null;
    const clickToSession = totalClicks > 0 ? (totalSessions / totalClicks) * 100 : null;

    return { totalClicks, totalSessions, avgBounceRate, clickToSession };
  }, [combinedData]);

  const PRESETS: DateRange[] = [7, 30, 90];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">통합 분석</h1>
          <p className="text-sm text-muted-foreground mt-1">Meta 광고 클릭 → GA4 세션 흐름 분석</p>
        </div>
        {/* 날짜 범위 선택 */}
        <div className="flex items-center gap-1">
          {PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                days === d
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          title="총 클릭수"
          value={loadingMetrics ? "—" : kpi.totalClicks.toLocaleString()}
          icon={MousePointerClick}
          color="text-indigo-600"
          sub="Meta Ads"
        />
        <KpiCard
          title="총 세션"
          value={loadingMetrics ? "—" : kpi.totalSessions.toLocaleString()}
          icon={Users}
          color="text-emerald-600"
          sub="GA4"
        />
        <KpiCard
          title="클릭→세션 전환율"
          value={
            loadingMetrics
              ? "—"
              : kpi.clickToSession !== null
              ? `${kpi.clickToSession.toFixed(1)}%`
              : "데이터 없음"
          }
          icon={ArrowRightLeft}
          color="text-amber-600"
          sub="세션 / 클릭 × 100"
        />
        <KpiCard
          title="평균 이탈률"
          value={
            loadingMetrics
              ? "—"
              : kpi.avgBounceRate !== null
              ? `${(kpi.avgBounceRate * 100).toFixed(1)}%`
              : "데이터 없음"
          }
          icon={TrendingDown}
          color="text-rose-600"
          sub="GA4 기준"
        />
      </div>

      {/* 복합 차트 */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">광고 클릭 vs GA4 세션 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMetrics ? (
            <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground animate-pulse">
              차트 로딩 중...
            </div>
          ) : combinedData.length === 0 ? (
            <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">
              선택한 기간에 데이터가 없습니다.
            </div>
          ) : (
            <CombinedMetricsChart data={combinedData} height={320} />
          )}
        </CardContent>
      </Card>

      {/* 랜딩페이지 테이블 */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">랜딩페이지별 성과</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LandingPageTable pages={pages} loading={loadingPages} />
        </CardContent>
      </Card>
    </div>
  );
}
