"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, ExternalLink } from "lucide-react";

interface Props {
  initialActions: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function ActionsAdmin({ initialActions, clients }: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id || "");

  const openCreate = () => {
    setClientId(clients[0]?.id || "");
    setPickerOpen(true);
  };

  const goToNewPage = () => {
    if (!clientId) return;
    setPickerOpen(false);
    router.push(`/admin/clients/${clientId}/actions/new`);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> 실행 항목 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>클라이언트</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead className="text-right">수정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    등록된 실행 항목이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                initialActions.map((action: any) => (
                  <TableRow key={action.id}>
                    <TableCell className="text-sm">
                      {action.clients?.name || "-"}
                    </TableCell>
                    <TableCell className="font-medium">{action.title}</TableCell>
                    <TableCell>{action.category}</TableCell>
                    <TableCell>
                      <StatusBadge status={action.status} />
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(action.action_date)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/clients/${action.client_id}/actions/${action.id}`} aria-label="실행 항목 수정">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>실행 항목 작성</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">클라이언트를 선택한 뒤 작성 페이지로 이동합니다.</p>
          <div className="space-y-2">
            <Label>클라이언트</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>취소</Button>
            <Button onClick={goToNewPage} disabled={!clientId}>
              <ExternalLink className="h-4 w-4 mr-2" /> 작성 페이지로 이동
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
