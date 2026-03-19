"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { BoostingPeriod, IgDailyStat } from "./follower-trend-chart";

interface Props {
  boostingPeriods: BoostingPeriod[];
  stats: IgDailyStat[];
}

interface PeriodStats {
  avgReach: number;
  followerGrowth: number;
  avgImpressions: number;
  days: number;
}

function statsForPeriod(stats: IgDailyStat[], from: string, to: string): PeriodStats {
  const filtered = stats.filter((s) => s.stat_date >= from && s.stat_date <= to);
  if (filtered.length === 0) return { avgReach: 0, followerGrowth: 0, avgImpressions: 0, days: 0 };

  const avgReach = filtered.reduce((s, d) => s + (d.reach ?? 0), 0) / filtered.length;
  const avgImpressions = filtered.reduce((s, d) => s + (d.impressions ?? 0), 0) / filtered.length;
  const firstFollowers = filtered[0].followers_count ?? 0;
  const lastFollowers = filtered[filtered.length - 1].followers_count ?? 0;
  const followerGrowth = firstFollowers > 0 ? ((lastFollowers - firstFollowers) / firstFollowers) * 100 : 0;

  return { avgReach, followerGrowth, avgImpressions, days: filtered.length };
}

function diffPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function DiffBadge({ pct }: { pct: number }) {
  if (Math.abs(pct) < 0.1) {
    return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="h-3 w-3" />0%</span>;
  }
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export function BoostingComparison({ boostingPeriods, stats }: Props) {
  const [selectedId, setSelectedId] = useState<string>(boostingPeriods[0]?.id ?? "");

  const selected = useMemo(
    () => boostingPeriods.find((b) => b.id === selectedId),
    [boostingPeriods, selectedId],
  );

  const { boostStats, prevStats } = useMemo(() => {
    if (!selected) return { boostStats: null, prevStats: null };

    const bStats = statsForPeriod(stats, selected.start_date, selected.end_date);

    // 직전 동일 기간 계산
    const start = new Date(selected.start_date);
    const end = new Date(selected.end_date);
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 86400_000);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const pStats = statsForPeriod(
      stats,
      prevStart.toISOString().split("T")[0],
      prevEnd.toISOString().split("T")[0],
    );

    return { boostStats: bStats, prevStats: pStats };
  }, [selected, stats]);

  if (boostingPeriods.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          등록된 부스팅 기간이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold">부스팅 효과 비교</h3>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-8 text-xs w-[200px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              {boostingPeriods.map((bp) => (
                <SelectItem key={bp.id} value={bp.id}>
                  {bp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && boostStats && prevStats ? (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {selected.start_date} ~ {selected.end_date} ({boostStats.days}일) vs 직전 동일 기간
              {selected.budget_won && (
                <span className="ml-2 text-indigo-600 font-medium">
                  예산: ₩{selected.budget_won.toLocaleString()}
                </span>
              )}
            </p>

            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "평균 일별 도달",
                  current: boostStats.avgReach,
                  previous: prevStats.avgReach,
                  format: (v: number) => Math.round(v).toLocaleString(),
                },
                {
                  label: "팔로워 증가율",
                  current: boostStats.followerGrowth,
                  previous: prevStats.followerGrowth,
                  format: (v: number) => `${v.toFixed(2)}%`,
                },
                {
                  label: "평균 일별 노출",
                  current: boostStats.avgImpressions,
                  previous: prevStats.avgImpressions,
                  format: (v: number) => Math.round(v).toLocaleString(),
                },
              ].map((metric) => (
                <div key={metric.label} className="p-3 rounded-xl bg-muted/40 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                  <p className="text-xl font-bold tabular-nums">{metric.format(metric.current)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      이전: {metric.format(metric.previous)}
                    </span>
                    <DiffBadge pct={diffPct(metric.current, metric.previous)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            선택한 기간에 데이터가 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
