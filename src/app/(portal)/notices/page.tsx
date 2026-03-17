import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { NoticesClient } from "./notices-client";

export const metadata: Metadata = {
  title: "공지사항 | Onecation",
  description: "공지사항",
};

export default async function NoticesPage() {
  await requireClient();
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, content, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> 공지사항
        </h1>
        <p className="text-muted-foreground text-sm mt-1">중요 공지를 확인하세요.</p>
      </div>

      <NoticesClient announcements={announcements || []} />
    </div>
  );
}
