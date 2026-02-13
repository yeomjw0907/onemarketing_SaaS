import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationSettings } from "./notification-settings";

export const metadata: Metadata = {
  title: "알림 설정 | Onecation 관리자",
  description: "카카오 알림톡 등 알림 설정",
};

export default async function NotificationsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_name, contact_phone, is_active")
    .order("name");

  // 최근 알림 발송 로그
  const { data: logs } = await supabase
    .from("notification_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">알림 설정</h1>
        <p className="text-muted-foreground text-sm mt-1">
          카카오 알림톡을 통해 클라이언트에게 보고서 발행, 일정 알림 등을 발송합니다.
        </p>
      </div>
      <NotificationSettings clients={clients || []} logs={logs || []} />
    </div>
  );
}
