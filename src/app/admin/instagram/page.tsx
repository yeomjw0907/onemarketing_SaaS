import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { InstagramOverview } from "./instagram-overview";

export default async function AdminInstagramPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("instagram_accounts")
    .select(
      `
      id,
      client_id,
      instagram_id,
      username,
      followers_count,
      status,
      error_message,
      last_synced_at,
      created_at,
      clients(id, name)
    `,
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instagram 계정 현황</h1>
        <p className="text-sm text-muted-foreground mt-1">
          전체 클라이언트의 Instagram 연결 상태
        </p>
      </div>

      <InstagramOverview accounts={accounts ?? []} />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium">클라이언트</th>
                <th className="text-left p-3 font-medium">계정명</th>
                <th className="text-right p-3 font-medium">팔로워</th>
                <th className="text-left p-3 font-medium">마지막 동기화</th>
                <th className="text-center p-3 font-medium">상태</th>
                <th className="text-center p-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {(accounts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    연결된 Instagram 계정이 없습니다.
                  </td>
                </tr>
              ) : (
                (accounts ?? []).map((acc: Record<string, unknown>, i: number) => {
                  const client = acc.clients as Record<string, unknown> | null;
                  return (
                    <tr key={acc.id as string} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="p-3 font-medium">
                        {client?.name as string ?? "—"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {acc.username ? `@${acc.username}` : acc.instagram_id as string}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {acc.followers_count
                          ? (acc.followers_count as number).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {acc.last_synced_at
                          ? formatDistanceToNow(new Date(acc.last_synced_at as string), {
                              addSuffix: true,
                              locale: ko,
                            })
                          : "동기화 전"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            acc.status === "active"
                              ? "default"
                              : acc.status === "error"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[11px]"
                        >
                          {acc.status === "active"
                            ? "정상"
                            : acc.status === "error"
                            ? "오류"
                            : String(acc.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/admin/clients/${acc.client_id as string}?tab=integrations`}
                          className="text-xs text-primary hover:underline"
                        >
                          클라이언트 보기
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
