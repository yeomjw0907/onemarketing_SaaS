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
import { formatDate, formatPhoneDisplay, formatPhoneInput, phoneToDigits } from "@/lib/utils";
import { Plus, Pencil, ChevronRight, Search } from "lucide-react";

interface Props {
  initialClients: Client[];
}

export function ClientsAdmin({ initialClients }: Props) {
  const router = useRouter();
  const supabase = createSupabase();
  const [clients] = useState(initialClients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const resetForm = () => {
    setName("");
    setLoginEmail("");
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
    setLoginEmail("");
    setContactName(client.contact_name || "");
    setContactPhone(phoneToDigits(client.contact_phone) || "");
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
        const { error: updateErr } = await supabase
          .from("clients")
          .update({
            name,
            contact_name: contactName || null,
            contact_phone: phoneToDigits(contactPhone) || null,
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
        // 이메일 유효성 검사
        if (!loginEmail.includes("@")) {
          setError("올바른 이메일 형식을 입력해주세요.");
          return;
        }

        const res = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            login_email: loginEmail,
            client_code: loginEmail.split("@")[0],
            contact_name: contactName,
            contact_phone: phoneToDigits(contactPhone) || undefined,
            contact_email: contactEmail,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "생성 실패");
          return;
        }

        setSuccessMsg(data.message);
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

  // 검색 필터
  const filtered = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.client_code.toLowerCase().includes(q) ||
      (c.contact_name || "").toLowerCase().includes(q) ||
      (c.contact_email || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* 상단 바: 검색 + 추가 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="회사명, 코드, 담당자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> 클라이언트 추가
        </Button>
      </div>

      {/* ─── 데스크탑: 테이블 / 모바일: 카드 ─── */}

      {/* 데스크탑 테이블 */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회사명</TableHead>
                <TableHead>로그인 이메일</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "검색 결과가 없습니다." : "등록된 클라이언트가 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {client.contact_email || `${client.client_code}@onecation.co.kr`}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{client.contact_name || "-"}</div>
                      {client.contact_phone && (
                        <div className="text-xs text-muted-foreground">{formatPhoneDisplay(client.contact_phone)}</div>
                      )}
                    </TableCell>
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
                          onClick={(e) => { e.stopPropagation(); openEdit(client); }}
                          title="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="상세"
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin/clients/${client.id}`); }}
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

      {/* 모바일 카드 리스트 */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다." : "등록된 클라이언트가 없습니다."}
            </CardContent>
          </Card>
        ) : (
          filtered.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:bg-muted/30 transition-colors active:scale-[0.99]"
              onClick={() => router.push(`/admin/clients/${client.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{client.name}</p>
                      <Badge variant={client.is_active ? "done" : "hold"} className="shrink-0 text-[10px]">
                        {client.is_active ? "활성" : "비활성"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {client.contact_email || `${client.client_code}@onecation.co.kr`}
                    </p>
                    {client.contact_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        담당: {client.contact_name}
                        {client.contact_phone && ` · ${formatPhoneDisplay(client.contact_phone)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); openEdit(client); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 클라이언트 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "클라이언트 수정" : "클라이언트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: (주)원마케팅"
              />
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>로그인 이메일 *</Label>
                <Input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value.trim())}
                  placeholder="예: client@company.com"
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  이 이메일로 로그인합니다. 초기 비밀번호: <strong>Admin123!</strong>
                </p>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">담당자 정보</p>
              <div className="space-y-2">
                <Label>담당자 명</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="예: 홍길동" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    value={formatPhoneInput(contactPhone)}
                    onChange={(e) => setContactPhone(phoneToDigits(e.target.value))}
                    placeholder="010-1234-5678"
                    type="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hong@company.com" type="email" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
            )}
            {successMsg && (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{successMsg}</p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !name || (!editing && !loginEmail)}
              className="w-full sm:w-auto"
            >
              {loading ? "처리 중..." : editing ? "저장" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
