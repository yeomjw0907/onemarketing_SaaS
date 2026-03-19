"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface AccountItem {
  id: string;
  client_id: string;
  instagram_id: string;
  username: string | null;
  followers_count: number | null;
  status: string;
  error_message: string | null;
  last_synced_at: string | null;
  clients: { id: string; name: string } | null;
}

interface Props {
  accounts: AccountItem[];
}

export function InstagramOverview({ accounts }: Props) {
  const total = accounts.length;
  const active = accounts.filter((a) => a.status === "active").length;
  const error = accounts.filter((a) => a.status === "error").length;
  const totalFollowers = accounts.reduce((s, a) => s + (a.followers_count ?? 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-4 w-4 text-indigo-600" />
            <span className="text-xs text-muted-foreground font-medium">연결된 계정</span>
          </div>
          <p className="text-2xl font-bold">{total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground font-medium">정상</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{active}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <span className="text-xs text-muted-foreground font-medium">오류</span>
          </div>
          <p className="text-2xl font-bold text-rose-500">{error}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-muted-foreground font-medium">총 팔로워</span>
          </div>
          <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <div className="col-span-2 md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{acc.clients?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {acc.username ? `@${acc.username}` : acc.instagram_id}
                    </p>
                  </div>
                  <Badge
                    variant={acc.status === "active" ? "default" : acc.status === "error" ? "destructive" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    {acc.status === "active" ? "정상" : acc.status === "error" ? "오류" : acc.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-sm font-bold">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {acc.followers_count?.toLocaleString() ?? "—"}
                  <span className="text-xs text-muted-foreground font-normal ml-0.5">팔로워</span>
                </div>

                {acc.status === "error" && acc.error_message && (
                  <p className="text-xs text-rose-500 mt-2 line-clamp-2">{acc.error_message}</p>
                )}

                <Link
                  href={`/admin/clients/${acc.client_id}?tab=integrations`}
                  className="mt-3 text-xs text-primary hover:underline block"
                >
                  관리 →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
