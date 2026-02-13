"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  initialReports: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function ReportsAdmin({ initialReports, clients }: Props) {
  const router = useRouter();
  const [filterClient, setFilterClient] = useState("all");

  // 클라이언트 선택 다이얼로그 (리포트 작성 전)
  const [pickDialogOpen, setPickDialogOpen] = useState(false);
  const [pickClientId, setPickClientId] = useState(clients[0]?.id || "");

  const filteredReports = filterClient === "all"
    ? initialReports
    : initialReports.filter((r: any) => r.client_id === filterClient);

  const handleCreateReport = () => {
    if (clients.length === 1) {
      // 클라이언트가 1개면 바로 이동
      router.push(`/admin/clients/${clients[0].id}/reports/new`);
    } else {
      setPickClientId(clients[0]?.id || "");
      setPickDialogOpen(true);
    }
  };

  const goToEditor = () => {
    if (pickClientId) {
      router.push(`/admin/clients/${pickClientId}/reports/new`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="전체 클라이언트" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 클라이언트</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleCreateReport}><Plus className="h-4 w-4 mr-2" /> 리포트 작성</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>클라이언트</TableHead><TableHead>제목</TableHead>
            <TableHead>유형</TableHead><TableHead>발행일</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow>
            ) : filteredReports.map((r: any) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/clients/${r.client_id}`)}>
                <TableCell>{r.clients?.name || "-"}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell><Badge variant="outline">{r.report_type === "weekly" ? "주간" : "월간"}</Badge></TableCell>
                <TableCell className="text-sm">{formatDate(r.published_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* 클라이언트 선택 다이얼로그 */}
      <Dialog open={pickDialogOpen} onOpenChange={setPickDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>리포트 작성할 클라이언트 선택</DialogTitle></DialogHeader>
          <Select value={pickClientId} onValueChange={setPickClientId}>
            <SelectTrigger><SelectValue placeholder="클라이언트 선택" /></SelectTrigger>
            <SelectContent>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickDialogOpen(false)}>취소</Button>
            <Button onClick={goToEditor} disabled={!pickClientId}>에디터로 이동</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
