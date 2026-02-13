"use client";

import { useState } from "react";
import { SERVICE_CATALOG, type ServiceItem } from "@/lib/service-catalog";
import { ServiceIcon } from "@/components/service-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
  enabledServices: Record<string, boolean>;
}

export function ServiceCatalogView({ enabledServices }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [infoItem, setInfoItem] = useState<ServiceItem | null>(null);

  const categories = [
    { key: "all", label: "전체" },
    ...SERVICE_CATALOG.map((cat) => ({ key: cat.key, label: cat.label })),
  ];

  // 모든 서비스를 flat하게 가져오기
  const allItems = SERVICE_CATALOG.flatMap((cat) => cat.items);
  const filteredItems =
    selectedCategory === "all"
      ? allItems
      : SERVICE_CATALOG.find((c) => c.key === selectedCategory)?.items || [];

  const activeItems = filteredItems.filter((item) => enabledServices[item.key] === true);
  const inactiveItems = filteredItems.filter((item) => enabledServices[item.key] !== true);

  const totalActive = allItems.filter((item) => enabledServices[item.key] === true).length;

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h2 className="text-lg font-bold">서비스 항목</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalActive}개 서비스 이용중
          </p>
        </div>

        {/* 카테고리 필터 */}
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

        {/* 이용중인 서비스 */}
        {activeItems.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              이용중인 서비스
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm"
                >
                  <ServiceIcon iconKey={item.iconKey} color={item.color} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        이용중
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 미이용 서비스 */}
        {inactiveItems.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              추가 가능한 서비스
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inactiveItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setInfoItem(item)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-dashed border-border/60 text-left transition-all hover:bg-muted/50 hover:border-border hover:shadow-sm group"
                >
                  <ServiceIcon iconKey={item.iconKey} color={item.color} size="md" className="opacity-50 group-hover:opacity-80 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                      {item.category}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeItems.length === 0 && inactiveItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            해당 카테고리에 서비스가 없습니다.
          </div>
        )}
      </div>

      {/* 서비스 소개 모달 */}
      <Dialog open={!!infoItem} onOpenChange={() => setInfoItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {infoItem && <ServiceIcon iconKey={infoItem.iconKey} color={infoItem.color} size="lg" />}
              <div>
                <DialogTitle className="text-lg">{infoItem?.label}</DialogTitle>
                <Badge variant="secondary" className="text-xs mt-1">{infoItem?.category}</Badge>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {infoItem?.description}
            </p>
            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-5">
              <h4 className="text-sm font-bold mb-1.5">이 서비스가 필요하신가요?</h4>
              <p className="text-xs text-muted-foreground mb-4">
                현재 이용중이지 않은 서비스입니다. 도입을 원하시면 담당 매니저에게 문의해주세요.
              </p>
              <Link href="/support" onClick={() => setInfoItem(null)}>
                <Button className="w-full rounded-xl">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  문의 바로가기
                </Button>
              </Link>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInfoItem(null)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
