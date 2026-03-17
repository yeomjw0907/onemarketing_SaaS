"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

// ── 색상 팔레트 ──
const COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

interface KpiDataPoint {
  period_start: string;
  period_type: "weekly" | "monthly";
  metric_key: string;
  value: number;
}

interface KpiDef {
  metric_key: string;
  metric_label: string;
  unit: string;
}

interface KpiTrendChartProps {
  data: KpiDataPoint[];
  kpiDefs: KpiDef[];
}

type ViewMode = "weekly" | "monthly";

function formatDateLabel(dateStr: string, mode: ViewMode) {
  const d = new Date(dateStr);
  if (mode === "monthly") {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function KpiTrendChart({ data, kpiDefs }: KpiTrendChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  // 데이터 변환: [{date, kpi1: val, kpi2: val, ...}]
  const chartData = useMemo(() => {
    const filtered = data.filter((d) => d.period_type === viewMode);
    const byDate: Record<string, Record<string, number>> = {};

    for (const dp of filtered) {
      const key = dp.period_start;
      if (!byDate[key]) byDate[key] = {};
      byDate[key][dp.metric_key] = dp.value;
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        dateLabel: formatDateLabel(date, viewMode),
        ...vals,
      }));
  }, [data, viewMode]);

  // 차트에 표시할 KPI 목록
  const visibleKpis = kpiDefs.filter((k) =>
    data.some((d) => d.metric_key === k.metric_key && d.period_type === viewMode),
  );

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-sm">성과 추이 데이터가 아직 없습니다.</p>
          <p className="text-xs mt-1">관리자가 KPI 지표를 등록하면 차트가 나타납니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">성과 추이</h3>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("weekly")}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "weekly"
                  ? "bg-background shadow-sm font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              주별
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "monthly"
                  ? "bg-background shadow-sm font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              월별
            </button>
          </div>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {visibleKpis.map((kpi, i) => (
                  <linearGradient key={kpi.metric_key} id={`grad-${kpi.metric_key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: any, name: any) => {
                  const kpi = kpiDefs.find((k) => k.metric_key === name);
                  return [
                    `${Number(value).toLocaleString()} ${kpi?.unit || ""}`,
                    kpi?.metric_label || name,
                  ];
                }}
              />
              {visibleKpis.length > 1 && (
                <Legend
                  formatter={(value) => {
                    const kpi = kpiDefs.find((k) => k.metric_key === value);
                    return kpi?.metric_label || value;
                  }}
                  wrapperStyle={{ fontSize: "11px" }}
                />
              )}
              {visibleKpis.map((kpi, i) => (
                <Area
                  key={kpi.metric_key}
                  type="monotone"
                  dataKey={kpi.metric_key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  fill={`url(#grad-${kpi.metric_key})`}
                  dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 마케팅 대시보드용 멀티 메트릭 차트 ──

interface PlatformMetricDataPoint {
  date: string;
  [key: string]: string | number;
}

interface MetricChartProps {
  data: PlatformMetricDataPoint[];
  compareData?: PlatformMetricDataPoint[]; // 비교 기간 데이터 (점선)
  metricKeys: { key: string; label: string; color: string }[];
  title: string;
  chartType?: "area" | "bar" | "line";
  valueFormatter?: (v: number) => string;
  comparePeriodLabel?: string; // 툴팁에 표시할 비교 기간 라벨
}

export function MetricChart({
  data,
  compareData,
  metricKeys,
  title,
  chartType = "area",
  valueFormatter = (v) => v.toLocaleString(),
  comparePeriodLabel,
}: MetricChartProps) {
  if (data.length === 0) return null;

  // 비교 데이터를 인덱스 기준으로 현재 데이터에 병합
  // 키 네이밍: impressions_prev, clicks_prev ...
  const mergedData = data.map((d, i) => {
    const cmp = compareData?.[i];
    if (!cmp) return d;
    const extra: Record<string, number> = {};
    for (const mk of metricKeys) {
      const v = cmp[mk.key];
      if (v !== undefined) extra[`${mk.key}_prev`] = v as number;
    }
    return { ...d, ...extra };
  });

  const ChartComponent = chartType === "bar" ? BarChart : chartType === "line" ? LineChart : AreaChart;
  const hasCompare = (compareData?.length ?? 0) > 0;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5">
        <h3 className="text-sm font-bold mb-4">{title}</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={mergedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              {/* 그라디언트 defs (area only) */}
              {chartType === "area" && (
                <defs>
                  {metricKeys.map((mk) => (
                    <linearGradient key={mk.key} id={`mcg-${mk.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={mk.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={mk.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
              )}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: unknown, name: unknown) => {
                  const nameStr = String(name);
                  const isPrev = nameStr.endsWith("_prev");
                  const baseKey = isPrev ? nameStr.replace("_prev", "") : nameStr;
                  const m = metricKeys.find((k) => k.key === baseKey);
                  const label = m ? (isPrev ? `${m.label} (${comparePeriodLabel ?? "비교"})` : m.label) : nameStr;
                  return [valueFormatter(Number(value)), label];
                }}
              />
              {(metricKeys.length > 1 || hasCompare) && (
                <Legend
                  formatter={(v) => {
                    const isPrev = v.endsWith("_prev");
                    const baseKey = isPrev ? v.replace("_prev", "") : v;
                    const m = metricKeys.find((k) => k.key === baseKey);
                    return m ? (isPrev ? `${m.label} (${comparePeriodLabel ?? "비교"})` : m.label) : v;
                  }}
                  wrapperStyle={{ fontSize: "11px" }}
                />
              )}

              {/* 현재 기간 시리즈 */}
              {metricKeys.map((mk) => {
                if (chartType === "bar") {
                  return <Bar key={mk.key} dataKey={mk.key} fill={mk.color} radius={[4, 4, 0, 0]} />;
                }
                if (chartType === "line") {
                  return (
                    <Line key={mk.key} type="monotone" dataKey={mk.key}
                      stroke={mk.color} strokeWidth={2}
                      dot={{ r: 2.5, fill: mk.color, strokeWidth: 0 }}
                    />
                  );
                }
                return (
                  <Area key={mk.key} type="monotone" dataKey={mk.key}
                    stroke={mk.color} strokeWidth={2}
                    fill={`url(#mcg-${mk.key})`} fillOpacity={1}
                    dot={{ r: 2.5, fill: mk.color, strokeWidth: 0 }}
                  />
                );
              })}

              {/* 비교 기간 시리즈 (점선) */}
              {hasCompare && metricKeys.map((mk) => (
                <Line
                  key={`${mk.key}_prev`}
                  type="monotone"
                  dataKey={`${mk.key}_prev`}
                  stroke={mk.color}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  strokeOpacity={0.5}
                  dot={false}
                  legendType="line"
                />
              ))}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
