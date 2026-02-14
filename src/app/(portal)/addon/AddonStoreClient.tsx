"use client";

import { useState } from "react";
import { ADDON_CATALOG, type AddonItem } from "@/lib/addon-catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingCart, Loader2 } from "lucide-react";

const categories = [
  { key: "all", label: "전체" },
  ...ADDON_CATALOG.map((cat) => ({ key: cat.categoryKey, label: cat.categoryLabel })),
];

function formatPrice(n: number) {
  return `₩${n.toLocaleString()}`;
}

export function AddonStoreClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [orderItem, setOrderItem] = useState<AddonItem | null>(null);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredItems =
    selectedCategory === "all"
      ? ADDON_CATALOG.flatMap((c) => c.items)
      : ADDON_CATALOG.find((c) => c.categoryKey === selectedCategory)?.items ?? [];

  const handleRequest = (item: AddonItem) => {
    setOrderItem(item);
    setMemo("");
  };

  const handleSubmit = async () => {
    if (!orderItem) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/addon/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addon_key: orderItem.key, memo: memo.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "신청에 실패했습니다.");
        return;
      }
      toast.success("신청이 접수되었습니다. 담당자가 연락드립니다.");
      setOrderItem(null);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">부가 서비스 스토어</h1>
        <p className="text-sm text-muted-foreground mt-1">
          필요한 서비스를 골라 신청하세요. 담당자 확인 후 연락드립니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat.key
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.key}
            className="flex flex-col p-4 rounded-2xl bg-card border border-border/60 shadow-sm"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
              <p className="text-sm font-medium text-primary mt-2">
                {formatPrice(item.priceWon)}
                {item.priceNote && (
                  <span className="text-muted-foreground font-normal"> ({item.priceNote})</span>
                )}
              </p>
            </div>
            <Button
              className="mt-4 w-full rounded-xl"
              variant="default"
              size="sm"
              onClick={() => handleRequest(item)}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-2" />
              신청하기
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!orderItem} onOpenChange={() => !submitting && setOrderItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>부가 서비스 신청</DialogTitle>
          </DialogHeader>
          {orderItem && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-medium">{orderItem.label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{orderItem.description}</p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {formatPrice(orderItem.priceWon)} ({orderItem.priceNote})
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addon-memo">요청 사항 (선택)</Label>
                <Textarea
                  id="addon-memo"
                  placeholder="희망 일정, 구체적 요청사항 등"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOrderItem(null)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  접수 중
                </>
              ) : (
                "신청 접수"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
