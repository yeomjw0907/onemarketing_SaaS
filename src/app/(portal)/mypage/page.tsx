import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">클라이언트:</span> {session.client?.name ?? "-"}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">이메일:</span> {session.user?.email ?? "-"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
