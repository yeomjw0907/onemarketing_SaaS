import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarAdmin } from "./calendar-admin";

export const metadata: Metadata = {
  title: "캘린더 | Onecation 관리자",
  description: "전체 클라이언트 캘린더 이벤트",
};

export default async function AdminCalendarPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, clients(name)")
    .order("start_at", { ascending: false })
    .limit(200);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">캘린더 이벤트 (전체)</h1>
        <p className="text-muted-foreground text-sm mt-1">모든 클라이언트의 캘린더 이벤트를 모아봅니다. 클라이언트별 관리는 클라이언트 상세 페이지에서 가능합니다.</p>
      </div>
      <CalendarAdmin initialEvents={events || []} clients={clients || []} />
    </div>
  );
}
