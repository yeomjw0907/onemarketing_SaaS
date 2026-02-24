"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ServiceIcon } from "@/components/service-icon";
import { LayoutGrid } from "lucide-react";

export interface CategoryOption {
  key: string;
  label: string;
  iconKey: string;
  color: string;
}

export interface CategoryProgress {
  current: number;
  target: number;
  periodLabel: string;
}

interface Props {
  categories: CategoryOption[];
  currentCategory: string | null;
  idsFilter?: string | null;
  progressByCategory?: Record<string, CategoryProgress>;
}

export function ExecutionCategoryFilter({
  categories,
  currentCategory,
  idsFilter,
  progressByCategory,
}: Props) {
  const isAll = !currentCategory;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={idsFilter ? `/execution?ids=${encodeURIComponent(idsFilter)}` : "/execution"}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
          "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isAll
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        )}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted"
          aria-hidden
        >
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        </span>
        <span>전체</span>
      </Link>
      {categories.map((cat) => {
        const isSelected = currentCategory === cat.key;
        const progress = progressByCategory?.[cat.key];
        return (
          <Link
            key={cat.key}
            href={
              idsFilter
                ? `/execution?ids=${encodeURIComponent(idsFilter)}&category=${encodeURIComponent(cat.key)}`
                : `/execution?category=${encodeURIComponent(cat.key)}`
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <ServiceIcon
              iconKey={cat.iconKey}
              color={cat.color}
              size="sm"
              className="shrink-0"
            />
            <span className="flex items-center gap-1.5">
              <span>{cat.label}</span>
              {progress && (
                <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                  {progress.current}/{progress.target} ({progress.periodLabel})
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
