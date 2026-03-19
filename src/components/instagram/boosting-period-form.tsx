"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BoostingPeriod } from "./follower-trend-chart";

interface Props {
  clientId: string;
  accountId: string;
  existing?: BoostingPeriod;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BoostingPeriodForm({
  clientId,
  accountId,
  existing,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [label, setLabel] = useState(existing?.label ?? "");
  const [startDate, setStartDate] = useState(existing?.start_date ?? "");
  const [endDate, setEndDate] = useState(existing?.end_date ?? "");
  const [budgetWon, setBudgetWon] = useState(existing?.budget_won ? String(existing.budget_won) : "");
  const [metaCampaignId, setMetaCampaignId] = useState(existing?.meta_campaign_id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !startDate || !endDate) {
      setError("라벨, 시작일, 종료일은 필수입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = {
        clientId,
        accountId,
        label,
        startDate,
        endDate,
        budgetWon: budgetWon ? Number(budgetWon) : undefined,
        metaCampaignId: metaCampaignId || undefined,
      };

      let res: Response;
      if (existing) {
        res = await fetch(`/api/instagram/boosting/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            start_date: startDate,
            end_date: endDate,
            budget_won: budgetWon ? Number(budgetWon) : null,
            meta_campaign_id: metaCampaignId || null,
          }),
        });
      } else {
        res = await fetch("/api/instagram/boosting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "저장 실패");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "부스팅 기간 수정" : "부스팅 기간 추가"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bp-label">라벨 *</Label>
            <Input
              id="bp-label"
              placeholder="예: 10월 캠페인"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bp-start">시작일 *</Label>
              <Input
                id="bp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bp-end">종료일 *</Label>
              <Input
                id="bp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bp-budget">예산 (원)</Label>
            <Input
              id="bp-budget"
              type="number"
              placeholder="예: 500000"
              value={budgetWon}
              onChange={(e) => setBudgetWon(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bp-campaign">Meta 캠페인 ID (선택)</Label>
            <Input
              id="bp-campaign"
              placeholder="Meta Ads 캠페인 ID"
              value={metaCampaignId}
              onChange={(e) => setMetaCampaignId(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : existing ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
