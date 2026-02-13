import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, FileText, CalendarDays, Image } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const supabase = await createClient();

  // Fetch counts — 개별 에러 무시
  const safeCount = async (table: string) => {
    try {
      const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  const [clientsN, projectsN, eventsN, reportsN, assetsN] = await Promise.all([
    safeCount("clients"),
    safeCount("projects"),
    safeCount("calendar_events"),
    safeCount("reports"),
    safeCount("assets"),
  ]);

  const stats = [
    { label: "클라이언트", count: clientsN, icon: Users, href: "/admin/clients" },
    { label: "프로젝트", count: projectsN, icon: FolderKanban, href: "/admin/projects" },
    { label: "캘린더", count: eventsN, icon: CalendarDays, href: "/admin/calendar" },
    { label: "리포트", count: reportsN, icon: FileText, href: "/admin/reports" },
    { label: "자료실", count: assetsN, icon: Image, href: "/admin/assets" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">
          환영합니다, {session.profile.display_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="hover:shadow-md cursor-pointer transition-colors">
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
