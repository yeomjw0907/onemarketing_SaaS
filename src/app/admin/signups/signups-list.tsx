"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, X, UserPlus, Loader2 } from "lucide-react";
import { approveSignup, rejectSignup } from "./actions";

type PendingRow = {
  user_id: string;
  display_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  created_at: string;
};

type ClientRow = { id: string; name: string; client_code: string };

export function SignupsList({ pending, clients }: { pending: PendingRow[]; clients: ClientRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<Record<string, string>>({});

  const handleApprove = async (row: PendingRow) => {
    setLoadingId(row.user_id);
    try {
      const raw = selectedClientId[row.user_id];
      const clientId = !raw || raw === "__new__" ? null : raw;
      const result = await approveSignup(row.user_id, clientId, {
        display_name: row.display_name,
        email: row.email,
        company_name: row.company_name,
        phone: row.phone,
      });
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("이 가입 신청을 거절하시겠습니까?")) return;
    setLoadingId(userId);
    try {
      const result = await rejectSignup(userId);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (s: string) => {
    return new Date(s).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (pending.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <UserPlus className="mx-auto h-10 w-10 opacity-50 mb-3" />
          <p>대기 중인 가입 신청이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pending.map((row) => {
        const loading = loadingId === row.user_id;
        return (
          <Card key={row.user_id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {row.display_name || "이름 없음"}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {row.company_name || "회사명 없음"}
                  </Badge>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {formatDate(row.created_at)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">담당자</dt>
                  <dd className="font-medium">{row.display_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">회사/단체명</dt>
                  <dd className="font-medium">{row.company_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">이메일</dt>
                  <dd className="font-medium break-all">{row.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">전화번호</dt>
                  <dd className="font-medium">{row.phone || "—"}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-xs text-muted-foreground">승인 시 연결할 클라이언트</label>
                  <Select
                    value={selectedClientId[row.user_id] ?? ""}
                    onValueChange={(v) =>
                      setSelectedClientId((prev) => ({ ...prev, [row.user_id]: v }))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="기존 클라이언트 선택 또는 새로 생성" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__">새 클라이언트로 승인</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.client_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleApprove(row)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      승인
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleReject(row.user_id)}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  거절
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
