import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

const PATH_REDIRECT: Record<string, string> = {
  overview: "/overview",
  execution: "/execution",
  timeline: "/timeline",
};

export default async function PortalViewByTokenPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: row, error } = await supabase
    .from("client_portal_tokens")
    .select("id, client_id, path, expires_at")
    .eq("token", token)
    .single();

  if (error || !row) notFound();

  const expiresAt = new Date(row.expires_at);
  if (expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader>
            <h2 className="text-lg font-semibold text-center">링크 만료</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center text-sm">
              이 링크는 만료되었습니다. 로그인하여 대시보드를 확인해 주세요.
            </p>
            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline">
                <Link href="/login">로그인</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const redirectPath = PATH_REDIRECT[row.path] ?? "/overview";
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader>
          <h2 className="text-lg font-semibold text-center">대시보드로 이동</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            유효한 링크입니다. 아래 버튼을 눌러 로그인하면 해당 화면으로 이동합니다.
          </p>
          <div className="flex justify-center">
            <Button asChild className="gap-2">
              <Link href={loginUrl}>
                <LayoutDashboard className="h-4 w-4" />
                로그인하여 대시보드 보기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
