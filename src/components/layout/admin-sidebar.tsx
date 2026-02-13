"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FolderKanban,
  FileText,
  Image,
  Loader2,
} from "lucide-react";

const adminMenu = [
  { label: "대시보드", href: "/admin", icon: LayoutDashboard },
  { label: "클라이언트", href: "/admin/clients", icon: Users },
  { label: "캘린더", href: "/admin/calendar", icon: CalendarDays },
  { label: "프로젝트", href: "/admin/projects", icon: FolderKanban },
  { label: "리포트", href: "/admin/reports", icon: FileText },
  { label: "자료실", href: "/admin/assets", icon: Image },
];

export function AdminSidebar() {
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

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </div>
          <span className="text-lg font-semibold text-foreground">관리자</span>
        </Link>
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
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isPending && "pointer-events-none"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 전환 중 로딩 인디케이터 */}
      {isPending && (
        <div className="border-t px-6 py-3 flex items-center gap-2 text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          <p className="text-xs">로딩 중...</p>
        </div>
      )}
      {!isPending && (
        <div className="border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">Onecation 관리 콘솔</p>
        </div>
      )}
    </aside>
  );
}
