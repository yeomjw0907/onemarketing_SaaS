"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { AddonOrderStatus } from "@/lib/types/database";

export interface AddonOrderRow {
  id: string;
  client_id: string;
  addon_key: string;
  addon_label: string;
  price_won: number;
  status: AddonOrderStatus;
  memo: string | null;
  admin_notes: string | null;
  created_at: string;
  clients: { name: string } | null;
}

const STATUS_LABELS: Record<AddonOrderStatus, string> = {
  pending: "대기",
  confirmed: "확인됨",
  done: "완료",
  cancelled: "취소",
};

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str: string | null, max: number) {
  if (!str) return "-";
  return str.length <= max ? str : str.slice(0, max) + "…";
}

interface Props {
  initialOrders: AddonOrderRow[];
}

export function AddonOrdersAdmin({ initialOrders }: Props) {
  const [orders, setOrders] = useState<AddonOrderRow[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<AddonOrderRow | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const openEdit = (row: AddonOrderRow) => {
    setEditing(row);
    setAdminNotes(row.admin_notes ?? "");
  };

  const handleStatusChange = async (orderId: string, newStatus: AddonOrderStatus) => {
    try {
      const res = await fetch(`/api/admin/addon-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "저장 실패");
        return;
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success("상태가 변경되었습니다.");
    } catch {
      toast.error("네트워크 오류");
    }
  };

  const handleSaveNotes = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/addon-orders/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "저장 실패");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editing.id ? { ...o, admin_notes: adminNotes.trim() || null } : o
        )
      );
      setEditing(null);
      toast.success("관리자 메모가 저장되었습니다.");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">상태 필터</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {(Object.entries(STATUS_LABELS) as [AddonOrderStatus, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">주문일시</TableHead>
              <TableHead>클라이언트</TableHead>
              <TableHead>부가서비스</TableHead>
              <TableHead className="text-right w-[100px]">금액</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="max-w-[120px]">메모</TableHead>
              <TableHead className="max-w-[120px]">관리자 메모</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  주문이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(row.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.clients?.name ?? "-"}
                  </TableCell>
                  <TableCell>{row.addon_label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₩{row.price_won.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.status}
                      onValueChange={(v) => handleStatusChange(row.id, v as AddonOrderStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(STATUS_LABELS) as [AddonOrderStatus, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate" title={row.memo ?? undefined}>
                    {truncate(row.memo, 15)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate" title={row.admin_notes ?? undefined}>
                    {truncate(row.admin_notes, 15)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEdit(row)}>
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={() => !saving && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>주문 상세</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">클라이언트</span> {editing.clients?.name ?? "-"}</p>
                <p><span className="text-muted-foreground">서비스</span> {editing.addon_label}</p>
                <p><span className="text-muted-foreground">금액</span> ₩{editing.price_won.toLocaleString()}</p>
                <p><span className="text-muted-foreground">요청 메모</span> {editing.memo || "-"}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-notes">관리자 메모</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="진행 상황, 비고 등"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              닫기
            </Button>
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
