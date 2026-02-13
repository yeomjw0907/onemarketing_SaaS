"use client";

import { useMemo } from "react";
import { KpiTrendChart, MetricChart } from "@/components/charts/kpi-trend-chart";

interface KpiDef {
  metric_key: string;
  metric_label: string;
  unit: string;
}

interface KpiDataPoint {
  period_start: string;
  period_type: "weekly" | "monthly";
  metric_key: string;
  value: number;
}

interface PlatformMetricPoint {
  platform: string;
  metric_date: string;
  metric_key: string;
  metric_value: number;
}

interface Props {
  kpiDefs: KpiDef[];
  kpiTrendData: KpiDataPoint[];
  platformMetrics: PlatformMetricPoint[];
}

const PLATFORM_LABEL: Record<string, string> = {
  naver_ads: "네이버",
  naver_searchad: "네이버",
  meta_ads: "Meta",
  google_ads: "Google Ads",
  google_analytics: "GA4",
};

const CHART_COLORS: Record<string, string> = {
  naver_ads: "#03C75A",
  naver_searchad: "#03C75A",
  meta_ads: "#1877F2",
  google_ads: "#4285F4",
  google_analytics: "#F9AB00",
};

export function OverviewCharts({ kpiDefs, kpiTrendData, platformMetrics }: Props) {
  // ── 마케팅 지표 차트 데이터: 노출/클릭/비용 일별 추이 ──
  const adChartData = useMemo(() => {
    if (!platformMetrics.length) return [];

    const byDate: Record<string, Record<string, number>> = {};
    for (const m of platformMetrics) {
      // 광고 플랫폼 지표만 (GA4 제외)
      if (m.platform === "google_analytics") continue;
      if (!["impressions", "clicks", "cost"].includes(m.metric_key)) continue;

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
  }, [platformMetrics]);

  // ── GA4 트래픽 차트 데이터 ──
  const trafficChartData = useMemo(() => {
    if (!platformMetrics.length) return [];

    const byDate: Record<string, Record<string, number>> = {};
    for (const m of platformMetrics) {
      if (m.platform !== "google_analytics") continue;
      if (!["sessions", "users", "pageviews"].includes(m.metric_key)) continue;

      if (!byDate[m.metric_date]) byDate[m.metric_date] = {};
      byDate[m.metric_date][m.metric_key] = (byDate[m.metric_date][m.metric_key] || 0) + m.metric_value;
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        dateLabel: `${date.slice(5, 7)}/${date.slice(8, 10)}`,
        ...vals,
      }));
  }, [platformMetrics]);

  const hasKpiData = kpiTrendData.length > 0 && kpiDefs.length > 0;
  const hasAdData = adChartData.length > 0;
  const hasTrafficData = trafficChartData.length > 0;

  if (!hasKpiData && !hasAdData && !hasTrafficData) return null;

  return (
    <div className="space-y-4">
      {/* KPI 추이 */}
      {hasKpiData && (
        <KpiTrendChart data={kpiTrendData} kpiDefs={kpiDefs} />
      )}

      {/* 광고 / 트래픽 차트 (2열) */}
      {(hasAdData || hasTrafficData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {hasAdData && (
            <MetricChart
              title="광고 성과 추이 (일별)"
              data={adChartData}
              metricKeys={[
                { key: "impressions", label: "노출수", color: "#6366f1" },
                { key: "clicks", label: "클릭수", color: "#10b981" },
              ]}
              chartType="area"
            />
          )}

          {hasAdData && (
            <MetricChart
              title="광고 비용 추이 (일별)"
              data={adChartData}
              metricKeys={[
                { key: "cost", label: "비용(원)", color: "#f59e0b" },
              ]}
              chartType="bar"
              valueFormatter={(v) => `₩${v.toLocaleString()}`}
            />
          )}

          {hasTrafficData && (
            <MetricChart
              title="웹사이트 트래픽 (일별)"
              data={trafficChartData}
              metricKeys={[
                { key: "sessions", label: "세션", color: "#6366f1" },
                { key: "users", label: "사용자", color: "#10b981" },
              ]}
              chartType="line"
            />
          )}

          {hasTrafficData && (
            <MetricChart
              title="페이지뷰 (일별)"
              data={trafficChartData}
              metricKeys={[
                { key: "pageviews", label: "페이지뷰", color: "#8b5cf6" },
              ]}
              chartType="area"
            />
          )}
        </div>
      )}
    </div>
  );
}
