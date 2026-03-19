"use client";

import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Bookmark, Eye } from "lucide-react";

export interface IgMediaMetric {
  id: string;
  account_id: string;
  client_id: string;
  media_id: string;
  media_type: string | null;
  caption: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  posted_at: string | null;
  like_count: number | null;
  comments_count: number | null;
  saved_count: number | null;
  reach: number | null;
  impressions: number | null;
  engagement_rate: number | null;
}

interface Props {
  media: IgMediaMetric[];
  loading?: boolean;
}

function MediaCard({ m }: { m: IgMediaMetric }) {
  const imageUrl = m.thumbnail_url ?? m.media_url;
  const engRate = m.engagement_rate ? (Number(m.engagement_rate) * 100).toFixed(2) : null;

  return (
    <div className="group relative rounded-xl overflow-hidden bg-muted aspect-square">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={m.caption?.slice(0, 40) ?? "Instagram post"}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
          이미지 없음
        </div>
      )}

      {/* 미디어 타입 배지 */}
      {m.media_type && m.media_type !== "IMAGE" && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0">
            {m.media_type === "VIDEO" ? "영상" : m.media_type === "CAROUSEL_ALBUM" ? "슬라이드" : m.media_type === "REEL" ? "릴스" : m.media_type === "STORY" ? "스토리" : m.media_type}
          </Badge>
        </div>
      )}

      {/* 참여율 배지 */}
      {engRate && (
        <div className="absolute top-2 left-2">
          <Badge className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white border-0">
            {engRate}%
          </Badge>
        </div>
      )}

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-white text-xs">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{(m.reach ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span>{(m.like_count ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5" />
            <span>{(m.saved_count ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{(m.comments_count ?? 0).toLocaleString()}</span>
          </div>
        </div>
        {m.caption && (
          <p className="text-white/80 text-[10px] text-center line-clamp-3 mt-1">
            {m.caption}
          </p>
        )}
        {m.posted_at && (
          <p className="text-white/60 text-[10px]">
            {new Date(m.posted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-muted aspect-square animate-pulse" />
  );
}

export function MediaGrid({ media, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!media.length) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        게시물 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {media.map((m) => (
        <MediaCard key={m.id} m={m} />
      ))}
    </div>
  );
}
