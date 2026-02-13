"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@/lib/types/database";
import { createClient as createSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, ChevronRight } from "lucide-react";

interface Props {
  initialClients: Client[];
}

export function ClientsAdmin({ initialClients }: Props) {
  const router = useRouter();
  const supabase = createSupabase();
  const [clients, setClients] = useState(initialClients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const resetForm = () => {
    setName("");
    setClientCode("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setError("");
    setSuccessMsg("");
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setClientCode(client.client_code);
    setContactName(client.contact_name || "");
    setContactPhone(client.contact_phone || "");
    setContactEmail(client.contact_email || "");
    setError("");
    setSuccessMsg("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (editing) {
        // 수정 — 기존 클라이언트 정보 업데이트
        const { error: updateErr } = await supabase
          .from("clients")
          .update({
            name,
            contact_name: contactName || null,
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null,
          })
          .eq("id", editing.id);

        if (updateErr) {
          setError(updateErr.message);
          return;
        }
        setDialogOpen(false);
        router.refresh();
      } else {
        // 생성 — API 호출 (Auth 유저 + 프로필 + 클라이언트 한 번에)
        const res = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            client_code: clientCode,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "생성 실패");
          return;
        }

        setSuccessMsg(data.message);
        // 2초 후 다이얼로그 닫기
        setTimeout(() => {
          setDialogOpen(false);
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || "오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> 클라이언트 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회사명</TableHead>
                <TableHead>클라이언트 코드</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    등록된 클라이언트가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {client.client_code}@onecation.co.kr
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">{client.contact_name || "-"}</TableCell>
                    <TableCell className="text-sm">{client.contact_phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "done" : "hold"}>
                        {client.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(client);
                          }}
                          title="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="상세 보기"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/clients/${client.id}`);
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 클라이언트 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "클라이언트 수정" : "클라이언트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 회사명 */}
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: (주)원마케팅"
              />
            </div>

            {/* 클라이언트 코드 — 생성 시만 */}
            {!editing && (
              <div className="space-y-2">
                <Label>클라이언트 코드 (로그인 ID) *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                    placeholder="예: onemarketing"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    @onecation.co.kr
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  로그인 이메일: <strong>{clientCode || "code"}@onecation.co.kr</strong> / 초기 비밀번호: <strong>Admin123!</strong>
                </p>
              </div>
            )}

            {/* 담당자 정보 */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">담당자 정보</p>
              <div className="space-y-2">
                <Label>담당자 명</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label>담당자 연락처</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>담당자 이메일</Label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="예: hong@company.com"
                  type="email"
                />
              </div>
            </div>

            {/* 에러/성공 메시지 */}
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}
            {successMsg && (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{successMsg}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !name || (!editing && !clientCode)}
            >
              {loading ? "처리 중..." : editing ? "저장" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
