import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { CareHistoryTimeline } from "@/components/dashboard/care-history-timeline";

export const metadata: Metadata = {
  title: "타임라인 | Onecation",
  description: "알림톡으로 발송된 성과 요약 이력",
};

export default async function TimelinePage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "timeline")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("client_id", clientId)
    .order("sent_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">타임라인</h1>
        <p className="text-sm text-muted-foreground mt-1">
          카카오 알림톡으로 발송된 성과 요약을 시간순으로 확인할 수 있습니다.
        </p>
      </div>
      <CareHistoryTimeline notifications={notifications ?? []} />
    </div>
  );
}
