"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CombinedMetric } from "@/lib/types/database";

interface Props {
  data: CombinedMetric[];
  height?: number;
}

function formatDate(dateStr: string) {
  return `${dateStr.slice(5, 7)}/${dateStr.slice(8, 10)}`;
}

function formatNumber(v: number) {
  return v.toLocaleString("ko-KR");
}

function formatPercent(v: number) {
  return `${v.toFixed(1)}%`;
}

export function CombinedMetricsChart({ data, height = 320 }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
    bounce_rate_pct: d.bounce_rate !== undefined ? d.bounce_rate * 100 : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        {/* 왼쪽 Y축: Meta 클릭수 */}
        <YAxis
          yAxisId="left"
          orientation="left"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatNumber}
          width={50}
        />
        {/* 오른쪽 Y축: GA4 세션수 */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatNumber}
          width={50}
        />
        {/* 오른쪽 Y2축: 이탈률 % (0~100) */}
        <YAxis
          yAxisId="rate"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          width={40}
          hide={!data.some((d) => d.bounce_rate !== undefined)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => {
            if (name === "Meta 클릭수" || name === "GA4 세션") return [formatNumber(value), name];
            if (name === "이탈률") return [formatPercent(value), name];
            return [value, name];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
        />

        {/* Meta Ads 클릭수 — Bar */}
        <Bar
          yAxisId="left"
          dataKey="clicks"
          name="Meta 클릭수"
          fill="#6366f1"
          opacity={0.8}
          radius={[3, 3, 0, 0]}
          maxBarSize={32}
        />

        {/* GA4 세션수 — Line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sessions"
          name="GA4 세션"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />

        {/* 이탈률 — 점선 Line */}
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="bounce_rate_pct"
          name="이탈률"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
