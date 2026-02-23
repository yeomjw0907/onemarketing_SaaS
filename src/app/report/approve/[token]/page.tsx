import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApproveButton } from "./approve-button";

interface Props {
  params: Promise<{ token: string }>;
}

type Status = "pending" | "approved" | "expired" | "invalid";

export default async function ReportApprovePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: row } = await supabase
    .from("notifications")
    .select("id, approval_status, approval_used_at, approval_token_expires_at, view_token")
    .eq("approval_token", token)
    .single();

  let status: Status = "invalid";
  let viewToken: string | null = null;

  if (row) {
    viewToken = row.view_token;
    const expiresAt = row.approval_token_expires_at
      ? new Date(row.approval_token_expires_at)
      : null;
    if (expiresAt && expiresAt < new Date()) {
      status = "expired";
    } else if (row.approval_status === "APPROVED" && row.approval_used_at) {
      status = "approved";
    } else {
      status = "pending";
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <h1 className="text-xl font-semibold">제안 승인</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "invalid" && (
            <p className="text-muted-foreground text-center">
              유효하지 않거나 만료된 링크입니다.
            </p>
          )}
          {status === "expired" && (
            <p className="text-muted-foreground text-center">
              승인 링크가 만료되었습니다.
            </p>
          )}
          {status === "approved" && (
            <>
              <p className="text-center text-green-600 font-medium">이미 승인되었습니다.</p>
              {viewToken && (
                <Button asChild className="w-full">
                  <Link href={`/report/v/${viewToken}`}>자세히 보기</Link>
                </Button>
              )}
            </>
          )}
          {status === "pending" && (
            <>
              <p className="text-muted-foreground text-center text-sm">
                아래 버튼을 누르면 제안이 승인됩니다.
              </p>
              <ApproveButton token={token} viewToken={viewToken} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
