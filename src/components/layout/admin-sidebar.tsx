"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useMobileSidebar } from "@/components/layout/mobile-sidebar-wrapper";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FolderKanban,
  FileText,
  Image,
  Bell,
  Loader2,
  PanelLeftClose,
  PanelRight,
} from "lucide-react";

const adminMenu = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "클라이언트", href: "/admin/clients", icon: Users },
  { label: "캘린더", href: "/admin/calendar", icon: CalendarDays },
  { label: "프로젝트", href: "/admin/projects", icon: FolderKanban },
  { label: "리포트", href: "/admin/reports", icon: FileText },
  { label: "자료실", href: "/admin/assets", icon: Image },
  { label: "알림 설정", href: "/admin/notifications", icon: Bell },
];

export function AdminSidebar() {
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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-[width] duration-200 ease-out",
        "w-full md:w-16",
        isCollapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* 로고 + 데스크톱 토글 */}
      <div
        className={cn(
          "flex h-16 items-center shrink-0 border-b px-3 md:px-2",
          isCollapsed ? "md:justify-center" : "justify-between px-4 md:px-3"
        )}
      >
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2 min-w-0",
            isCollapsed && "md:justify-center"
          )}
          onClick={handleNav("/admin")}
          aria-label="관리자 대시보드"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </div>
          <span
            className={cn(
              "text-lg font-semibold text-foreground truncate",
              isCollapsed ? "md:hidden" : "md:block"
            )}
          >
            관리자
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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {adminMenu.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNav(item.href)}
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isCollapsed && "md:justify-center md:px-2",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isPending && "pointer-events-none"
                  )}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn("truncate", isCollapsed ? "md:hidden" : "md:block")}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {isPending && (
        <div className="border-t px-4 py-3 flex items-center gap-2 text-primary shrink-0 md:justify-center md:px-2">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          <p className={cn("text-xs truncate", isCollapsed ? "md:hidden" : "md:block")}>
            로딩 중...
          </p>
        </div>
      )}
      {!isPending && (
        <div className={cn("border-t px-4 py-3 shrink-0", isCollapsed ? "md:px-2 md:flex md:justify-center" : "")}>
          <p className={cn("text-xs text-muted-foreground truncate", isCollapsed ? "md:hidden" : "md:block")}>
            Onecation 관리 콘솔
          </p>
        </div>
      )}
    </aside>
  );
}
