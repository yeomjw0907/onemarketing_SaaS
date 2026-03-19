"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

export interface IgDailyStat {
  id?: string;
  account_id?: string;
  client_id?: string;
  stat_date: string;
  followers_count: number | null;
  impressions: number | null;
  reach: number | null;
  profile_views: number | null;
  website_clicks: number | null;
}

export interface BoostingPeriod {
  id: string;
  client_id: string;
  account_id: string | null;
  label: string;
  start_date: string;
  end_date: string;
  budget_won: number | null;
  platform: string | null;
  meta_campaign_id: string | null;
  created_at?: string;
}

interface Props {
  stats: IgDailyStat[];
  boostingPeriods: BoostingPeriod[];
  height?: number;
}

const BOOSTING_COLOR = "#8b5cf6";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function FollowerTrendChart({ stats, boostingPeriods, height = 280 }: Props) {
  if (!stats.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          팔로워 추이 데이터가 없습니다.
        </CardContent>
      </Card>
    );
  }

  const chartData = stats.map((s) => ({
    date: s.stat_date,
    label: formatDate(s.stat_date),
    팔로워: s.followers_count ?? 0,
    도달: s.reach ?? 0,
    노출: s.impressions ?? 0,
  }));

  const minFollowers = Math.min(...chartData.map((d) => d.팔로워).filter((v) => v > 0));
  const yDomainMin = minFollowers > 0 ? Math.floor(minFollowers * 0.95) : 0;

  return (
    <Card>
      <CardContent className="pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">팔로워 추이</h3>
          {boostingPeriods.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-3 w-5 rounded-sm opacity-40" style={{ backgroundColor: BOOSTING_COLOR }} />
              부스팅 기간
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[yDomainMin, "auto"]}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
              width={45}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />

            {/* 부스팅 기간 하이라이트 */}
            {boostingPeriods.map((bp) => {
              const start = formatDate(bp.start_date);
              const end = formatDate(bp.end_date);
              return (
                <ReferenceArea
                  key={bp.id}
                  x1={start}
                  x2={end}
                  fill={BOOSTING_COLOR}
                  fillOpacity={0.08}
                  stroke={BOOSTING_COLOR}
                  strokeOpacity={0.3}
                  strokeWidth={1}
                  label={{ value: bp.label, position: "insideTop", fontSize: 10, fill: BOOSTING_COLOR }}
                />
              );
            })}

            <Line
              type="monotone"
              dataKey="팔로워"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="도달"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
