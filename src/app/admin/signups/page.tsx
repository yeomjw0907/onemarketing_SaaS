import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignupsList } from "./signups-list";

export const metadata: Metadata = {
  title: "가입 대기 | Onecation 관리자",
  description: "회원가입 승인 대기 목록",
};

export default async function AdminSignupsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, company_name, phone, created_at")
    .eq("role", "pending")
    .order("created_at", { ascending: false });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">가입 대기</h1>
        <p className="text-muted-foreground text-sm mt-1">
          회원가입 신청을 승인하거나 거절할 수 있습니다.
        </p>
      </div>
      <SignupsList pending={pending ?? []} clients={clients ?? []} />
    </div>
  );
}
