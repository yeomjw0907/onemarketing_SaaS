"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { cn } from "@/lib/utils";
import { EnabledModules } from "@/lib/types/database";
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
  { key: "support", label: "문의하기", href: "/support", icon: MessageCircle, color: "text-cyan-600" },
];

interface ClientSidebarProps {
  enabledModules: EnabledModules;
  clientName: string;
}

export function ClientSidebar({ enabledModules, clientName }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNav = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      startTransition(() => {
        router.push(href);
      });
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

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-card/80 backdrop-blur-sm border-r border-border/50">
      {/* 로고 */}
      <div className="flex h-16 items-center px-5">
        <Link href="/overview" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-sm">
            O
          </div>
          <div>
            <span className="text-base font-bold text-foreground tracking-tight">Onecation</span>
          </div>
        </Link>
      </div>

      {/* 클라이언트 이름 */}
      <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-muted/50">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">클라이언트</p>
        <p className="text-sm font-semibold truncate mt-0.5">{clientName}</p>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
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
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/8 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    isPending && "pointer-events-none opacity-60"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-primary/10" : "bg-muted/50"
                  )}>
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : item.color)} />
                  </div>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 마케팅 성과 (별도 섹션) */}
        <div className="mt-4 pt-3 border-t border-border/40">
          <p className="px-3 mb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">분석</p>
          <Link
            href="/marketing"
            onClick={handleNav("/marketing")}
            prefetch={true}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              (pathname === "/marketing" || pathname.startsWith("/marketing/"))
                ? "bg-primary/8 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              isPending && "pointer-events-none opacity-60"
            )}
          >
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
              (pathname === "/marketing" || pathname.startsWith("/marketing/"))
                ? "bg-primary/10" : "bg-muted/50"
            )}>
              <BarChart3 className={cn("h-3.5 w-3.5", (pathname === "/marketing" || pathname.startsWith("/marketing/")) ? "text-primary" : "text-indigo-600")} />
            </div>
            마케팅 성과
          </Link>
        </div>
      </nav>

      {/* 하단 */}
      <div className="p-3 space-y-2">
        {isPending && (
          <div className="flex items-center gap-2 text-primary px-3 py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <p className="text-xs font-medium">로딩 중...</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all w-full"
        >
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted/50">
            <LogOut className="h-3.5 w-3.5" />
          </div>
          로그아웃
        </button>
        <div className="px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground/60">Powered by Onecation</p>
        </div>
      </div>
    </aside>
  );
}
