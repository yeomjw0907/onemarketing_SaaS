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
  FileText,
  Image,
  MessageCircle,
  Loader2,
  LogOut,
  BarChart3,
  PanelLeftClose,
  PanelRight,
  Settings,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  moduleKey?: keyof EnabledModules;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

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

  const navSections: NavSection[] = [
    {
      items: [
        { href: "/overview",  label: "홈",      icon: LayoutDashboard, color: "text-slate-600",  moduleKey: "overview" },
        { href: "/marketing", label: "광고 성과", icon: BarChart3,       color: "text-indigo-600" },
        { href: "/reports",   label: "리포트",   icon: FileText,        color: "text-amber-600",  moduleKey: "reports" },
      ],
    },
    {
      title: "진행 현황",
      items: [
        { href: "/execution", label: "진행 업무", icon: Zap,        color: "text-violet-600", moduleKey: "execution" },
        { href: "/calendar",  label: "일정",      icon: CalendarDays, color: "text-blue-600",  moduleKey: "calendar" },
      ],
    },
    {
      title: "자료",
      items: [
        { href: "/assets", label: "자료실", icon: Image, color: "text-rose-600", moduleKey: "assets" },
      ],
    },
    {
      title: "소통",
      items: [
        { href: "/notices", label: "공지사항", icon: Megaphone,     color: "text-slate-600" },
        ...(enabledModules.support
          ? [{ href: "/support", label: "문의하기", icon: MessageCircle, color: "text-cyan-600" } as NavItem]
          : []),
      ],
    },
    {
      title: "계정",
      items: [
        { href: "/mypage", label: "설정", icon: Settings, color: "text-slate-600" },
      ],
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={handleNav(item.href)}
          onMouseEnter={() => handlePrefetch(item.href)}
          prefetch={true}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
            isCollapsed && "md:justify-center md:px-2",
            active
              ? "bg-primary/8 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            isPending && "pointer-events-none opacity-60"
          )}
          title={isCollapsed ? item.label : undefined}
        >
          <div
            className={cn(
              "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
              active ? "bg-primary/10" : "bg-muted/50"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : item.color)} />
          </div>
          <span className={cn("truncate block", isCollapsed ? "md:hidden" : "md:block")}>
            {item.label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card/80 backdrop-blur-sm border-r border-border/50 transition-[width] duration-200 ease-out",
        "w-full md:w-16",
        isCollapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* 로고 + 데스크톱 토글 */}
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
          <img
            src="/logo-light.png"
            alt="ONEmarketing"
            className={cn("h-7 w-auto object-contain", isCollapsed ? "md:h-6" : "md:h-7")}
          />
          <span className="sr-only">ONEmarketing</span>
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

      {/* 클라이언트 이름 */}
      {!isCollapsed && (
        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-muted/50 shrink-0 hidden md:block">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">클라이언트</p>
          <p className="text-sm font-semibold truncate mt-0.5">{clientName}</p>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.moduleKey || enabledModules[item.moduleKey]
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={sIdx} className={cn(sIdx > 0 && "mt-4 pt-3 border-t border-border/40")}>
              {section.title && (
                <p className={cn(
                  "px-3 mb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
                  isCollapsed && "md:hidden"
                )}>
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map(renderItem)}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* 하단: 로그아웃 */}
      <div className={cn("p-3 space-y-2 shrink-0 border-t border-border/40", isCollapsed && "md:px-2")}>
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
          <p className="text-[10px] text-muted-foreground/60">Powered by ONEmarketing</p>
        </div>
      </div>
    </aside>
  );
}
