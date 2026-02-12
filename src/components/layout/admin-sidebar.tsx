"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Zap,
  CalendarDays,
  FolderKanban,
  FileText,
  Image,
  TrendingUp,
} from "lucide-react";

const adminMenu = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "KPI 정의", href: "/admin/kpis", icon: BarChart3 },
  { label: "Metrics", href: "/admin/metrics", icon: TrendingUp },
  { label: "Actions", href: "/admin/actions", icon: Zap },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Assets", href: "/admin/assets", icon: Image },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </div>
          <span className="text-lg font-semibold text-foreground">Admin</span>
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
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-subtle",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

      <div className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">Onecation Admin Console</p>
      </div>
    </aside>
  );
}
