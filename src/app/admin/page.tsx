import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, FolderKanban, FileText, CalendarDays, Image } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const supabase = await createClient();

  // Fetch counts
  const [clients, actions, projects, reports, events, assets] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("actions").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("calendar_events").select("id", { count: "exact", head: true }),
    supabase.from("assets").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Clients", count: clients.count || 0, icon: Users, href: "/admin/clients" },
    { label: "Actions", count: actions.count || 0, icon: Zap, href: "/admin/actions" },
    { label: "Projects", count: projects.count || 0, icon: FolderKanban, href: "/admin/projects" },
    { label: "Calendar Events", count: events.count || 0, icon: CalendarDays, href: "/admin/calendar" },
    { label: "Reports", count: reports.count || 0, icon: FileText, href: "/admin/reports" },
    { label: "Assets", count: assets.count || 0, icon: Image, href: "/admin/assets" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          환영합니다, {session.profile.display_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="transition-subtle hover:shadow-md cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
