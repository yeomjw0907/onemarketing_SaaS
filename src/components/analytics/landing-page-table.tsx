"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageStat {
  pagePath: string;
  totalSessions: number;
  totalUsers?: number;
  totalPageviews?: number;
  avgBounceRate: number;
  avgScrollDepth90: number;
  avgSessionDuration: number;
}

type SortKey = "totalSessions" | "avgBounceRate" | "avgScrollDepth90" | "avgSessionDuration";

interface Props {
  pages: PageStat[];
  loading?: boolean;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}초`;
  return `${m}분 ${s.toString().padStart(2, "0")}초`;
}

function ScrollBar({ value }: { value: number }) {
  const pct = Math.min(Math.round(value * 100), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-400",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums w-9 text-right">{pct}%</span>
    </div>
  );
}

export function LandingPageTable({ pages, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("totalSessions");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...pages].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortAsc ? av - bv : bv - av;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
        데이터 로딩 중...
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        수집된 페이지 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="min-w-[200px]">페이지 경로</TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:text-foreground"
              onClick={() => handleSort("totalSessions")}
            >
              <span className="inline-flex items-center justify-end gap-1">
                세션 <SortIcon col="totalSessions" />
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:text-foreground"
              onClick={() => handleSort("avgBounceRate")}
            >
              <span className="inline-flex items-center justify-end gap-1">
                이탈률 <SortIcon col="avgBounceRate" />
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:text-foreground"
              onClick={() => handleSort("avgSessionDuration")}
            >
              <span className="inline-flex items-center justify-end gap-1">
                평균 세션시간 <SortIcon col="avgSessionDuration" />
              </span>
            </TableHead>
            <TableHead
              className="min-w-[140px] cursor-pointer select-none hover:text-foreground"
              onClick={() => handleSort("avgScrollDepth90")}
            >
              <span className="inline-flex items-center gap-1">
                스크롤 90% <SortIcon col="avgScrollDepth90" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((page) => (
            <TableRow key={page.pagePath} className="hover:bg-muted/20">
              <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[280px]" title={page.pagePath}>
                {page.pagePath}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {page.totalSessions.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(page.avgBounceRate * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatDuration(page.avgSessionDuration)}
              </TableCell>
              <TableCell>
                <ScrollBar value={page.avgScrollDepth90} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
