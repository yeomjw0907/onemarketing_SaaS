import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { Settings } from "lucide-react";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "환경설정 | Onecation",
  description: "환경설정",
};

export default async function SettingsPage() {
  await requireClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" /> 환경설정
        </h1>
        <p className="text-muted-foreground text-sm mt-1">계정 및 환경을 설정합니다.</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
