"use client";

import { useState, useMemo } from "react";
import { Asset, AssetCollection } from "@/lib/types/database";
import { FileItemCard } from "@/components/file-item-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FolderOpen, Grid3X3, List, ChevronRight,
  Download, Eye, Image as ImageIcon, FileText,
  Layers, ArrowLeft, Package,
} from "lucide-react";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
function isImage(filePath: string) {
  return IMAGE_EXTS.has(filePath.split(".").pop()?.toLowerCase() ?? "");
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "로고",
  guideline: "가이드라인",
  font: "폰트",
  photo: "사진",
  video: "영상",
  other: "기타",
};

interface AssetsClientProps {
  assets: Asset[];
  collections: AssetCollection[];
  collectionItems: { collection_id: string; asset_id: string }[];
  imageUrlMap: Record<string, string>;
}

// ── 이미지 썸네일 카드 ──────────────────────────────────────
function AssetThumbnailCard({ asset, imageUrl }: { asset: Asset; imageUrl: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleView = () => {
    window.open(imageUrl, "_blank");
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "assets", file_path: asset.file_path, action: "download" }),
      });
      const data = await res.json();
      if (data.url) {
        const fileRes = await fetch(data.url);
        const blob = await fileRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = asset.file_path.split("/").pop() || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={asset.title}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <p className="text-white text-xs font-medium truncate mb-2">{asset.title}</p>
        <div className="flex gap-1.5">
          <button
            onClick={handleView}
            className="flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-medium bg-white/25 hover:bg-white/40 text-white transition-colors"
          >
            <Eye className="h-3 w-3" />보기
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1 px-2 h-6 rounded-md text-[11px] font-medium bg-white/25 hover:bg-white/40 text-white transition-colors disabled:opacity-60"
          >
            <Download className="h-3 w-3" />{downloading ? "…" : "저장"}
          </button>
        </div>
      </div>
      {/* Type badge (hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">
          {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
        </span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────
export function AssetsClient({
  assets,
  collections,
  collectionItems,
  imageUrlMap,
}: AssetsClientProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 컬렉션별 파일 수
  const itemCountByCol = useMemo(() => {
    const m: Record<string, number> = {};
    for (const item of collectionItems) {
      m[item.collection_id] = (m[item.collection_id] ?? 0) + 1;
    }
    return m;
  }, [collectionItems]);

  // 컬렉션 카드 미리보기 파일명 (최대 3개)
  const previewByCol = useMemo(() => {
    const m: Record<string, Asset[]> = {};
    for (const item of collectionItems) {
      const asset = assets.find((a) => a.id === item.asset_id);
      if (asset) {
        if (!m[item.collection_id]) m[item.collection_id] = [];
        if (m[item.collection_id]!.length < 3) m[item.collection_id]!.push(asset);
      }
    }
    return m;
  }, [collectionItems, assets]);

  // 표시할 파일 목록 (컬렉션 선택 시 필터링)
  const visibleAssets = useMemo(() => {
    if (!selectedCollectionId) return assets;
    const assetIds = new Set(
      collectionItems
        .filter((i) => i.collection_id === selectedCollectionId)
        .map((i) => i.asset_id)
    );
    return assets.filter((a) => assetIds.has(a.id));
  }, [assets, collectionItems, selectedCollectionId]);

  const imageAssets = visibleAssets.filter((a) => isImage(a.file_path));
  const otherAssets = visibleAssets.filter((a) => !isImage(a.file_path));

  const selectedCollection = selectedCollectionId
    ? collections.find((c) => c.id === selectedCollectionId)
    : null;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          {selectedCollection ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCollectionId(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />자료실
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedCollection.color }}
                />
                <span className="text-sm font-semibold">{selectedCollection.name}</span>
                {selectedCollection.description && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — {selectedCollection.description}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">자료실</h1>
              <p className="text-muted-foreground text-sm mt-0.5">브랜드 에셋 및 공유 자료</p>
            </>
          )}
        </div>

        {/* 그리드/리스트 토글 */}
        <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            title="그리드 보기"
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="리스트 보기"
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 컬렉션 카드 (홈 뷰에서만) */}
      {!selectedCollectionId && collections.length > 0 && (
        <section>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            <Layers className="h-3.5 w-3.5" />컬렉션
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setSelectedCollectionId(col.id)}
                className="group relative text-left p-4 rounded-xl border border-border/60 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden"
              >
                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                  style={{ backgroundColor: col.color }}
                />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm leading-tight">{col.name}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {itemCountByCol[col.id] ?? 0}개
                    </Badge>
                  </div>
                  {col.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {col.description}
                    </p>
                  )}
                  {previewByCol[col.id] && previewByCol[col.id]!.length > 0 ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {previewByCol[col.id]!.map((a) => a.title).join(" · ")}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">파일 없음</p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <FolderOpen className="h-3 w-3" />열기
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 파일 목록 */}
      {!selectedCollectionId && collections.length > 0 && assets.length > 0 && (
        <div className="border-t border-border/40 pt-2">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            <Package className="h-3.5 w-3.5" />전체 파일 ({assets.length})
          </h2>
        </div>
      )}

      {visibleAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {selectedCollectionId ? "이 컬렉션에 파일이 없습니다" : "등록된 파일이 없습니다"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 이미지 그리드 */}
          {imageAssets.length > 0 && (
            <section>
              {otherAssets.length > 0 && (
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  <ImageIcon className="h-3.5 w-3.5" />
                  이미지 ({imageAssets.length})
                </h3>
              )}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {imageAssets.map((asset) => {
                    const imgUrl = imageUrlMap[asset.id];
                    return imgUrl ? (
                      <AssetThumbnailCard key={asset.id} asset={asset} imageUrl={imgUrl} />
                    ) : (
                      <div key={asset.id} className="aspect-square">
                        <FileItemCard
                          title={asset.title}
                          subtitle={asset.tags?.join(", ")}
                          badge={ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
                          bucket="assets"
                          filePath={asset.file_path}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {imageAssets.map((asset) => (
                    <FileItemCard
                      key={asset.id}
                      title={asset.title}
                      subtitle={asset.tags?.join(", ")}
                      badge={ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
                      bucket="assets"
                      filePath={asset.file_path}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 비이미지 파일 목록 */}
          {otherAssets.length > 0 && (
            <section>
              {imageAssets.length > 0 && (
                <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  <FileText className="h-3.5 w-3.5" />
                  파일 ({otherAssets.length})
                </h3>
              )}
              <div className="space-y-2">
                {otherAssets.map((asset) => (
                  <FileItemCard
                    key={asset.id}
                    title={asset.title}
                    subtitle={asset.tags?.join(", ")}
                    badge={ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
                    bucket="assets"
                    filePath={asset.file_path}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
