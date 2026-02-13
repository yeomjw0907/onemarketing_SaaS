"use client";

import {
  SiMeta, SiGoogle, SiLinkedin, SiTiktok, SiYoutube, SiGoogleanalytics, SiGoogletagmanager,
} from "react-icons/si";
import {
  RiSearchLine, RiFileChartLine, RiPagesLine, RiCoupon3Line,
  RiArticleLine, RiInstagramLine, RiSeoLine, RiLayoutMasonryLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";

// 당근마켓 커스텀 아이콘 (SVG)
function DaangnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 7.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5S13.17 8 14 8s1.5.67 1.5 1.5zM8 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 5c-2.33 0-4.31-1.46-5.11-3.5h10.22C16.31 16.54 14.33 18 12 18z" />
    </svg>
  );
}

// 네이버 커스텀 아이콘
function NaverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
    </svg>
  );
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  naver: NaverIcon,
  google: SiGoogle,
  meta: SiMeta,
  linkedin: SiLinkedin,
  tiktok: SiTiktok,
  daangn: DaangnIcon,
  youtube: SiYoutube,
  ga: SiGoogleanalytics,
  gtm: SiGoogletagmanager,
  report: RiFileChartLine,
  landing: RiPagesLine,
  promo: RiCoupon3Line,
  blog: RiArticleLine,
  sns: RiInstagramLine,
  seo: RiSeoLine,
  display: RiLayoutMasonryLine,
};

interface ServiceIconProps {
  iconKey: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ServiceIcon({ iconKey, color, size = "md", className }: ServiceIconProps) {
  const Icon = iconMap[iconKey] || RiSearchLine;
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color + "14", color }}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
}
