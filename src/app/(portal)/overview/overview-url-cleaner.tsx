"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Meta OAuth 등으로 /overview에 metaToken·metaExpiresIn·#_=_ 가 붙어 들어온 경우
 * (비관리자가 admin 콜백 URL로 리다이렉트된 경우) URL을 깨끗하게 정리합니다.
 * ref로 한 번만 실행해 리다이렉트 루프/깜빡임 방지.
 */
export function OverviewUrlCleaner() {
  const router = useRouter();
  const cleaned = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || cleaned.current) return;
    const params = new URLSearchParams(window.location.search);
    const hasToken = params.has("metaToken") || params.has("metaExpiresIn");
    const hasHash = window.location.hash === "#_=_";
    if (hasToken || hasHash) {
      cleaned.current = true;
      router.replace("/overview", { scroll: false });
    }
  }, [router]);

  return null;
}
