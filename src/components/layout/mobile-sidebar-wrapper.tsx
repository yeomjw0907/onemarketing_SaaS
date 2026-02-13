"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "portal-sidebar-open";

interface MobileSidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextValue>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
  desktopSidebarOpen: true,
  setDesktopSidebarOpen: () => {},
});

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

/**
 * 모바일 사이드바 래퍼
 * - 데스크탑(md 이상): 고정 사이드바
 * - 모바일(md 미만): 오버레이 + 슬라이드 사이드바
 */
export function MobileSidebarWrapper({
  sidebar,
  children,
  footer,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpenState] = useState(true);
  const pathname = usePathname();

  // 데스크톱 사이드바 열림 상태 초기화 (localStorage)
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored !== null) setDesktopSidebarOpenState(stored !== "0");
    } catch (_) {}
  }, []);

  const setDesktopSidebarOpen = useCallback((open: boolean) => {
    setDesktopSidebarOpenState(open);
    try {
      localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch (_) {}
  }, []);

  // 라우트 변경 시 모바일만 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 열려 있으면 body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);

  const contentMarginClass = desktopSidebarOpen ? "md:ml-60" : "md:ml-16";

  return (
    <MobileSidebarContext.Provider
      value={{
        isOpen,
        toggle,
        close,
        desktopSidebarOpen,
        setDesktopSidebarOpen,
      }}
    >
      <div className="min-h-screen bg-background flex flex-col">
        {/* 데스크탑 사이드바 — md 이상에서만 보임 */}
        <div className="hidden md:block">{sidebar}</div>

        {/* 모바일 오버레이 */}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* 모바일 사이드바 슬라이드 */}
        <div
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-72 transform transition-transform duration-200 ease-out md:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={close}
            className="absolute right-3 top-4 z-10 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5" />
          </button>
          {sidebar}
        </div>

        {/* 메인 + 푸터: 사이드바와 같은 열에 맞춰 겹침 방지 */}
        <div className={cn("flex-1 flex flex-col min-h-0 min-w-0", contentMarginClass)}>
          <div className="flex-1 flex flex-col min-h-0">{children}</div>
          {footer != null && <div className="w-full shrink-0">{footer}</div>}
        </div>
      </div>
    </MobileSidebarContext.Provider>
  );
}

/**
 * 모바일 헤더 햄버거 버튼
 */
export function MobileMenuButton() {
  const { toggle } = useMobileSidebar();

  return (
    <button
      onClick={toggle}
      className="md:hidden p-2 -ml-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
      aria-label="메뉴 열기"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
