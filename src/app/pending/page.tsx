import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { PendingActions } from "./pending-actions";

export default async function PendingPage() {
  const session = await requireAuth();
  // #region agent log
  await fetch("http://127.0.0.1:7810/ingest/2774bd9c-1201-4e20-b252-2831d892fdf5", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f446e0" },
    body: JSON.stringify({
      sessionId: "f446e0",
      location: "pending/page.tsx:after-requireAuth",
      message: "Pending page after requireAuth",
      data: { role: session?.profile?.role, profileKeys: session?.profile ? Object.keys(session.profile) : [] },
      timestamp: Date.now(),
      hypothesisId: "H4",
    }),
  }).catch(() => {});
  // #endregion
  if (session.profile.role === "client") redirect("/overview");
  if (session.profile.role === "admin") redirect("/admin");
  if (session.profile.role === "rejected") redirect("/login?rejected=1");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="text-2xl font-bold">O</span>
          </div>
          <CardTitle className="text-xl">승인 대기 중</CardTitle>
          <CardDescription>
            가입이 완료되었습니다. 관리자 승인 후 포털을 이용할 수 있습니다.
            <br />
            보통 1~2 영업일 내에 처리됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            문의가 필요하시면 관리자에게 연락해 주세요.
          </p>
          <PendingActions />
        </CardContent>
      </Card>
    </div>
  );
}
