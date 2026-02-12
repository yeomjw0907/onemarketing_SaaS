"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface SidebarItem {
  key: keyof EnabledModules;
  label: string;
  href: string;
  icon: React.ElementType;
}

const menuItems: SidebarItem[] = [
  { key: "overview", label: "Overview", href: "/overview", icon: LayoutDashboard },
  { key: "execution", label: "Execution", href: "/execution", icon: Zap },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
  { key: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
  { key: "reports", label: "Reports", href: "/reports", icon: FileText },
  { key: "assets", label: "Assets", href: "/assets", icon: Image },
  { key: "support", label: "Support", href: "/support", icon: MessageCircle },
];

interface ClientSidebarProps {
  enabledModules: EnabledModules;
  clientName: string;
}

export function ClientSidebar({ enabledModules, clientName }: ClientSidebarProps) {
  const pathname = usePathname();

  const visibleItems = menuItems.filter((item) => enabledModules[item.key]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-card">
      {/* Logo area */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/overview" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </div>
          <span className="text-lg font-semibold text-foreground">Onecation</span>
        </Link>
      </div>

      {/* Client name */}
      <div className="border-b px-6 py-3">
        <p className="text-xs text-muted-foreground">Client</p>
        <p className="text-sm font-medium truncate">{clientName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.key}>
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

      {/* Footer */}
      <div className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">Powered by Onecation</p>
      </div>
    </aside>
  );
}
