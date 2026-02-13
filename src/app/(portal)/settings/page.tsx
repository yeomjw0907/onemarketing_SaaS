import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">설정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            환경설정 항목은 추후 제공될 예정입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
