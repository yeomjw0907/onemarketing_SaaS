"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { cn } from "@/lib/utils";
import { EnabledModules } from "@/lib/types/database";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-wrapper";
import {
  LayoutDashboard,
  Zap,
  CalendarDays,
  FolderKanban,
  FileText,
  Image,
  MessageCircle,
  Loader2,
  LogOut,
  BarChart3,
  PanelLeftClose,
  PanelRight,
  User,
  Megaphone,
  Link2,
  ShoppingCart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SidebarItem {
  key: keyof EnabledModules;
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const menuItems: SidebarItem[] = [
  { key: "overview", label: "개요", href: "/overview", icon: LayoutDashboard, color: "text-slate-600" },
  { key: "execution", label: "실행 현황", href: "/execution", icon: Zap, color: "text-violet-600" },
  { key: "calendar", label: "캘린더", href: "/calendar", icon: CalendarDays, color: "text-blue-600" },
  { key: "projects", label: "프로젝트", href: "/projects", icon: FolderKanban, color: "text-emerald-600" },
  { key: "reports", label: "리포트", href: "/reports", icon: FileText, color: "text-amber-600" },
  { key: "assets", label: "자료실", href: "/assets", icon: Image, color: "text-rose-600" },
];

interface ClientSidebarProps {
  enabledModules: EnabledModules;
  clientName: string;
}

export function ClientSidebar({ enabledModules, clientName }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { desktopSidebarOpen, setDesktopSidebarOpen } = useMobileSidebar();
  const isCollapsed = !desktopSidebarOpen;

  const handleNav = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const handlePrefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const visibleItems = menuItems.filter((item) => enabledModules[item.key]);
  const isMarketingActive = pathname === "/marketing" || pathname.startsWith("/marketing/");

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card/80 backdrop-blur-sm border-r border-border/50 transition-[width] duration-200 ease-out",
        "w-full md:w-16",
        isCollapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* 로고 + 데스크톱 토글 — 접힌 상태에서는 세로 배치로 겹침 방지 */}
      <div
        className={cn(
          "flex items-center shrink-0 px-3 md:px-2",
          isCollapsed ? "h-16 md:flex-col md:justify-center md:gap-1" : "h-16 justify-between"
        )}
      >
        <Link
          href="/overview"
          className={cn(
            "flex items-center gap-2.5 min-w-0",
            isCollapsed && "md:shrink-0 md:justify-center"
          )}
          onClick={handleNav("/overview")}
        >
          <span className={cn("text-base font-bold text-foreground tracking-tight truncate block", isCollapsed ? "md:hidden" : "md:block")}>
            Onecation
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          className="hidden md:flex shrink-0 h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
          title={desktopSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
          aria-label={desktopSidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
        >
          {desktopSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 클라이언트 이름 — 접힌 상태에서는 숨김 */}
      {!isCollapsed && (
        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-muted/50 shrink-0 hidden md:block">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">클라이언트</p>
          <p className="text-sm font-semibold truncate mt-0.5">{clientName}</p>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={handleNav(item.href)}
                  onMouseEnter={() => handlePrefetch(item.href)}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isCollapsed && "md:justify-center md:px-2",
                    isActive
                      ? "bg-primary/8 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    isPending && "pointer-events-none opacity-60"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div
                    className={cn(
                      "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                      isActive ? "bg-primary/10" : "bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : item.color)} />
                  </div>
                  <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 분석 */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <p className={cn("px-3 mb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider", isCollapsed && "md:hidden")}>
            분석
          </p>
          <Link
            href="/marketing"
            onClick={handleNav("/marketing")}
            onMouseEnter={() => handlePrefetch("/marketing")}
            prefetch={true}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isCollapsed && "md:justify-center md:px-2",
              isMarketingActive
                ? "bg-primary/8 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              isPending && "pointer-events-none opacity-60"
            )}
            title={isCollapsed ? "마케팅 성과" : undefined}
          >
            <div
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                isMarketingActive ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              <BarChart3 className={cn("h-3.5 w-3.5", isMarketingActive ? "text-primary" : "text-indigo-600")} />
            </div>
            <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>
              마케팅 성과
            </span>
          </Link>
          <Link
            href="/services"
            onClick={handleNav("/services")}
            onMouseEnter={() => handlePrefetch("/services")}
            prefetch={true}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mt-0.5",
              isCollapsed && "md:justify-center md:px-2",
              pathname === "/services" || pathname.startsWith("/services/")
                ? "bg-primary/8 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              isPending && "pointer-events-none opacity-60"
            )}
            title={isCollapsed ? "서비스" : undefined}
          >
            <div
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                pathname === "/services" || pathname.startsWith("/services/") ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              <Link2 className={cn("h-3.5 w-3.5", pathname === "/services" || pathname.startsWith("/services/") ? "text-primary" : "text-sky-600")} />
            </div>
            <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>
              서비스
            </span>
          </Link>
        </div>

        {/* 부가 서비스 */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <p className={cn("px-3 mb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider", isCollapsed && "md:hidden")}>
            부가 서비스
          </p>
          <Link
            href="/addon"
            onClick={handleNav("/addon")}
            onMouseEnter={() => handlePrefetch("/addon")}
            prefetch={true}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mt-0.5",
              isCollapsed && "md:justify-center md:px-2",
              pathname === "/addon" || pathname.startsWith("/addon/")
                ? "bg-primary/8 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              isPending && "pointer-events-none opacity-60"
            )}
            title={isCollapsed ? "부가 서비스 스토어" : undefined}
          >
            <div
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                pathname === "/addon" || pathname.startsWith("/addon/") ? "bg-primary/10" : "bg-muted/50"
              )}
            >
              <ShoppingCart className={cn("h-3.5 w-3.5", pathname === "/addon" || pathname.startsWith("/addon/") ? "text-primary" : "text-amber-600")} />
            </div>
            <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>
              부가 서비스 스토어
            </span>
          </Link>
        </div>

        {/* 계정 */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <p className={cn("px-3 mb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider", isCollapsed && "md:hidden")}>
            계정
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/mypage"
                onClick={handleNav("/mypage")}
                onMouseEnter={() => handlePrefetch("/mypage")}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isCollapsed && "md:justify-center md:px-2",
                  pathname === "/mypage" || pathname.startsWith("/mypage/")
                    ? "bg-primary/8 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  isPending && "pointer-events-none opacity-60"
                )}
                title={isCollapsed ? "마이페이지" : undefined}
              >
                <div className={cn(
                  "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                  pathname === "/mypage" || pathname.startsWith("/mypage/") ? "bg-primary/10" : "bg-muted/50"
                )}>
                  <User className={cn("h-3.5 w-3.5", pathname === "/mypage" || pathname.startsWith("/mypage/") ? "text-primary" : "text-slate-600")} />
                </div>
                <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>마이페이지</span>
              </Link>
            </li>
            <li>
              <Link
                href="/notices"
                onClick={handleNav("/notices")}
                onMouseEnter={() => handlePrefetch("/notices")}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isCollapsed && "md:justify-center md:px-2",
                  pathname === "/notices" || pathname.startsWith("/notices/")
                    ? "bg-primary/8 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  isPending && "pointer-events-none opacity-60"
                )}
                title={isCollapsed ? "공지사항" : undefined}
              >
                <div className={cn(
                  "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                  pathname === "/notices" || pathname.startsWith("/notices/") ? "bg-primary/10" : "bg-muted/50"
                )}>
                  <Megaphone className={cn("h-3.5 w-3.5", pathname === "/notices" || pathname.startsWith("/notices/") ? "text-primary" : "text-slate-600")} />
                </div>
                <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>공지사항</span>
              </Link>
            </li>
            {enabledModules.support && (
              <li>
                <Link
                  href="/support"
                  onClick={handleNav("/support")}
                  onMouseEnter={() => handlePrefetch("/support")}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isCollapsed && "md:justify-center md:px-2",
                    pathname === "/support" || pathname.startsWith("/support/")
                      ? "bg-primary/8 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    isPending && "pointer-events-none opacity-60"
                  )}
                  title={isCollapsed ? "문의하기" : undefined}
                >
                  <div className={cn(
                    "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                    pathname === "/support" || pathname.startsWith("/support/") ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    <MessageCircle className={cn("h-3.5 w-3.5", pathname === "/support" || pathname.startsWith("/support/") ? "text-primary" : "text-cyan-600")} />
                  </div>
                  <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>문의하기</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* 하단: 로그아웃 + 토글(접힌 때만) */}
      <div className={cn("p-3 space-y-2 shrink-0", isCollapsed && "md:px-2")}>
        {isPending && (
          <div className="flex items-center gap-2 text-primary px-3 py-2">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <p className={cn("text-xs font-medium truncate block", isCollapsed ? "md:hidden" : "md:block")}>
              로딩 중...
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all w-full",
            isCollapsed && "md:justify-center md:px-2"
          )}
          title="로그아웃"
          aria-label="로그아웃"
        >
          <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center bg-muted/50">
            <LogOut className="h-3.5 w-3.5" />
          </div>
          <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>
            로그아웃
          </span>
        </button>
        <div className={cn("px-3 py-1.5", isCollapsed && "md:hidden")}>
          <p className="text-[10px] text-muted-foreground/60">Powered by Onecation</p>
        </div>
      </div>
    </aside>
  );
}
