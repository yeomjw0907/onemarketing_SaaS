import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { User } from "lucide-react";
import { MypageContent } from "./mypage-content";

export const metadata: Metadata = {
  title: "마이페이지 | Onecation",
  description: "마이페이지",
};

export default async function MypagePage() {
  const session = await requireClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6" /> 마이페이지
        </h1>
        <p className="text-muted-foreground text-sm mt-1">내 정보를 확인하고 관리합니다.</p>
      </div>

      <MypageContent email={session.email} client={session.client} />
    </div>
  );
}
