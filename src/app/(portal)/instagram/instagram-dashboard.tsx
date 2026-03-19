"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, Image as ImageIcon, CalendarDays } from "lucide-react";
import { FollowerTrendChart } from "@/components/instagram/follower-trend-chart";
import { MediaGrid } from "@/components/instagram/media-grid";
import { BoostingComparison } from "@/components/instagram/boosting-comparison";
import type { IgDailyStat, BoostingPeriod } from "@/components/instagram/follower-trend-chart";
import type { IgMediaMetric } from "@/components/instagram/media-grid";

interface IgAccount {
  id: string;
  client_id: string;
  instagram_id: string;
  username: string | null;
  followers_count: number | null;
  media_count: number | null;
  profile_picture_url: string | null;
  status: string;
  last_synced_at: string | null;
}

interface Props {
  account: IgAccount;
  initialStats: IgDailyStat[];
  initialMedia: IgMediaMetric[];
  initialBoostingPeriods: BoostingPeriod[];
  defaultFrom: string;
  defaultTo: string;
}

const PRESET_DAYS = [30, 90, 180] as const;

export function InstagramDashboard({
  account,
  initialStats,
  initialMedia,
  initialBoostingPeriods,
  defaultFrom,
  defaultTo,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [stats, setStats] = useState<IgDailyStat[]>(initialStats);
  const [media, setMedia] = useState<IgMediaMetric[]>(initialMedia);
  const [boostingPeriods] = useState<BoostingPeriod[]>(initialBoostingPeriods);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [statsLoading, setStatsLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);

  const activeDays = (() => {
    const diff = Math.round(
      (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400_000,
    );
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateTo === todayStr && PRESET_DAYS.includes(diff as (typeof PRESET_DAYS)[number])) {
      return diff as (typeof PRESET_DAYS)[number];
    }
    return null;
  })();

  const fetchStats = async (from: string, to: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch(
        `/api/instagram/${account.id}/stats?from=${from}&to=${to}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { stats: IgDailyStat[] };
        setStats(data.stats);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/instagram/${account.id}/media?limit=20`);
      if (res.ok) {
        const data = (await res.json()) as { media: IgMediaMetric[] };
        setMedia(data.media);
      }
    } finally {
      setMediaLoading(false);
    }
  };

  const selectPreset = (days: number) => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400_000).toISOString().split("T")[0];
    setDateFrom(from);
    setDateTo(to);
    fetchStats(from, to);
  };

  const handleSync = () => {
    startTransition(() => {
      router.refresh();
    });
    fetchStats(dateFrom, dateTo);
    fetchMedia();
  };

  // 요약 지표 계산
  const latestStat = stats[stats.length - 1];
  const firstStat = stats[0];
  const followerGrowth =
    firstStat && latestStat && (firstStat.followers_count ?? 0) > 0
      ? latestStat.followers_count! - firstStat.followers_count!
      : null;
  const totalImpressions = stats.reduce((s, d) => s + (d.impressions ?? 0), 0);
  const avgReach =
    stats.length > 0
      ? Math.round(stats.reduce((s, d) => s + (d.reach ?? 0), 0) / stats.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {account.profile_picture_url && (
            <img
              src={account.profile_picture_url}
              alt={account.username ?? ""}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">인스타그램 인사이트</h1>
            <p className="text-sm text-muted-foreground">
              {account.username ? `@${account.username}` : account.instagram_id}
              {account.followers_count && (
                <span className="ml-2">· {account.followers_count.toLocaleString()} 팔로워</span>
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={statsLoading || mediaLoading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${statsLoading || mediaLoading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 기간 선택 */}
      <Card className="border-border/50">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium w-16 shrink-0">조회 기간</span>
            {PRESET_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => selectPreset(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  activeDays === d
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-muted-foreground font-medium">현재 팔로워</span>
            </div>
            <p className="text-xl font-bold tabular-nums">
              {(latestStat?.followers_count ?? account.followers_count ?? 0).toLocaleString()}
            </p>
            {followerGrowth !== null && (
              <p className={`text-xs mt-1 ${followerGrowth >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                {followerGrowth >= 0 ? "+" : ""}{followerGrowth.toLocaleString()} ({dateFrom} ~ {dateTo})
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground font-medium">평균 일별 도달</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{avgReach.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">기간 총 노출</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-pink-600" />
              <span className="text-xs text-muted-foreground font-medium">게시물 수</span>
            </div>
            <p className="text-xl font-bold tabular-nums">
              {(account.media_count ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 팔로워 추이 차트 */}
      <div>
        <h2 className="text-lg font-semibold mb-3">팔로워 추이</h2>
        <FollowerTrendChart stats={stats} boostingPeriods={boostingPeriods} />
      </div>

      {/* 부스팅 효과 비교 */}
      {boostingPeriods.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">부스팅 효과 비교</h2>
          <BoostingComparison boostingPeriods={boostingPeriods} stats={stats} />
        </div>
      )}

      {/* 미디어 그리드 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">최근 게시물</h2>
          <Badge variant="secondary" className="text-xs">{media.length}개</Badge>
        </div>
        <MediaGrid media={media} loading={mediaLoading} />
      </div>
    </div>
  );
}
