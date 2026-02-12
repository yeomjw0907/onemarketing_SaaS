import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { CalendarClient } from "./calendar-client";
import { CalendarDays } from "lucide-react";

export default async function CalendarPage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "calendar")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  // Fetch all events for the calendar
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("start_at", { ascending: true });

  // Recent done (last 14 days)
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: recentDone } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, status")
    .eq("client_id", clientId)
    .eq("status", "done")
    .gte("start_at", twoWeeksAgo)
    .order("start_at", { ascending: false })
    .limit(10);

  // Upcoming planned (next 14 days)
  const now = new Date().toISOString();
  const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString();
  const { data: upcomingPlanned } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, status")
    .eq("client_id", clientId)
    .eq("status", "planned")
    .gte("start_at", now)
    .lte("start_at", twoWeeksLater)
    .order("start_at", { ascending: true })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" /> Calendar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">마케팅 일정 관리</p>
      </div>
      <CalendarClient
        events={events || []}
        recentDone={recentDone || []}
        upcomingPlanned={upcomingPlanned || []}
      />
    </div>
  );
}
