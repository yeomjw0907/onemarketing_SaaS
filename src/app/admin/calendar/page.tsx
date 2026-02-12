import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarAdmin } from "./calendar-admin";

export default async function AdminCalendarPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, clients(name)")
    .order("start_at", { ascending: false })
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar Events 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">캘린더 이벤트를 관리합니다.</p>
      </div>
      <CalendarAdmin initialEvents={events || []} clients={clients || []} />
    </div>
  );
}
