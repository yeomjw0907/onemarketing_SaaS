"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Link2, Plus, Pencil, Trash2, Users, BarChart2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { BoostingPeriodForm } from "@/components/instagram/boosting-period-form";
import type { BoostingPeriod } from "@/components/instagram/follower-trend-chart";

interface IgAccount {
  id: string;
  client_id: string;
  instagram_id: string;
  username: string | null;
  followers_count: number | null;
  media_count: number | null;
  profile_picture_url: string | null;
  status: string;
  error_message: string | null;
  last_synced_at: string | null;
}

interface Props {
  clientId: string;
  initialAccounts: IgAccount[];
}

export function InstagramTab({ clientId, initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<IgAccount[]>(initialAccounts);
  const [boostingPeriods, setBoostingPeriods] = useState<BoostingPeriod[]>([]);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BoostingPeriod | undefined>();
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const loadBoostingPeriods = useCallback(async () => {
    const res = await fetch(`/api/instagram/boosting?clientId=${clientId}`);
    if (res.ok) {
      const data = (await res.json()) as { boostingPeriods: BoostingPeriod[] };
      setBoostingPeriods(data.boostingPeriods);
    }
  }, [clientId]);

  useEffect(() => {
    loadBoostingPeriods();
  }, [loadBoostingPeriods]);

  const handleSync = async (accountId: string) => {
    setSyncLoading(accountId);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/instagram-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { succeeded?: number; failed?: number };
        if ((data.failed ?? 0) > 0) {
          setSyncMsg("동기화 중 오류가 발생했습니다.");
        } else {
          setSyncMsg("동기화가 완료되었습니다.");
        }
        // 계정 목록 갱신
        const accRes = await fetch(`/api/instagram/boosting?clientId=${clientId}`).catch(() => null);
        void accRes;
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setSyncMsg(data.error ?? "동기화 실패");
      }
    } catch {
      setSyncMsg("동기화 오류 발생");
    } finally {
      setSyncLoading(null);
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!confirm("부스팅 기간을 삭제하시겠습니까?")) return;
    setDeleteLoading(periodId);
    try {
      const res = await fetch(`/api/instagram/boosting/${periodId}`, { method: "DELETE" });
      if (res.ok) {
        await loadBoostingPeriods();
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const primaryAccount = accounts[0];

  return (
    <div className="space-y-6">
      {/* 계정 연결 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Instagram 계정 연결</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `/api/instagram/connect?clientId=${clientId}`}
          >
            <Link2 className="h-4 w-4 mr-1.5" />
            {accounts.length > 0 ? "다시 연결" : "계정 연결"}
          </Button>
        </div>

        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <BarChart2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">연결된 Instagram 계정이 없습니다.</p>
              <p className="text-xs mt-1">위의 [계정 연결] 버튼을 눌러 Instagram Business Account를 연결하세요.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <Card key={acc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {acc.profile_picture_url && (
                      <img
                        src={acc.profile_picture_url}
                        alt={acc.username ?? ""}
                        className="h-12 w-12 rounded-full object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">
                          {acc.username ? `@${acc.username}` : acc.instagram_id}
                        </p>
                        <Badge
                          variant={acc.status === "active" ? "default" : acc.status === "error" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {acc.status === "active" ? "정상" : acc.status === "error" ? "오류" : acc.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {acc.followers_count?.toLocaleString() ?? "—"} 팔로워
                        </span>
                        <span>
                          게시물 {acc.media_count?.toLocaleString() ?? "—"}개
                        </span>
                      </div>
                      {acc.last_synced_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          마지막 동기화:{" "}
                          {formatDistanceToNow(new Date(acc.last_synced_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      )}
                      {acc.status === "error" && acc.error_message && (
                        <p className="text-xs text-destructive mt-1">{acc.error_message}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(acc.id)}
                      disabled={syncLoading === acc.id}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncLoading === acc.id ? "animate-spin" : ""}`} />
                      동기화
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {syncMsg && <p className="text-xs text-muted-foreground mt-2">{syncMsg}</p>}
      </div>

      {/* 부스팅 기간 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">부스팅 기간 관리</h3>
          <Button
            size="sm"
            onClick={() => {
              setEditingPeriod(undefined);
              setFormOpen(true);
            }}
            disabled={accounts.length === 0}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            추가
          </Button>
        </div>

        {boostingPeriods.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              등록된 부스팅 기간이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>라벨</TableHead>
                    <TableHead>시작일</TableHead>
                    <TableHead>종료일</TableHead>
                    <TableHead className="text-right">예산</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boostingPeriods.map((bp) => (
                    <TableRow key={bp.id}>
                      <TableCell className="font-medium">{bp.label}</TableCell>
                      <TableCell>{bp.start_date}</TableCell>
                      <TableCell>{bp.end_date}</TableCell>
                      <TableCell className="text-right">
                        {bp.budget_won ? `₩${bp.budget_won.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingPeriod(bp);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(bp.id)}
                            disabled={deleteLoading === bp.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <BoostingPeriodForm
        clientId={clientId}
        accountId={primaryAccount?.id ?? ""}
        existing={editingPeriod}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={loadBoostingPeriods}
      />
    </div>
  );
}
