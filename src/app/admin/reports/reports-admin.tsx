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
import { Plus, MessageSquare, ThumbsUp, ThumbsDown, Eye, EyeOff, Clock } from "lucide-react";

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
            <TableHead>열람</TableHead>
            <TableHead>피드백</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredReports.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow>
            ) : filteredReports.map((r: any) => {
              const views = (r.report_views as any[]) ?? [];
              const lastView = views.sort((a: any, b: any) =>
                new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
              )[0];
              const totalDuration = views.reduce((sum: number, v: any) => sum + (v.duration_seconds || 0), 0);
              return (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/reports/${r.id}`)}>
                <TableCell>{r.clients?.name || "-"}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell><Badge variant="outline">{r.report_type === "weekly" ? "주간" : "월간"}</Badge></TableCell>
                <TableCell className="text-sm">{formatDate(r.published_at)}</TableCell>
                <TableCell>
                  {lastView ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Eye className="h-3 w-3" />
                        {formatDate(lastView.opened_at)}
                      </span>
                      {totalDuration > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {totalDuration >= 60
                            ? `${Math.floor(totalDuration / 60)}분 ${totalDuration % 60}초`
                            : `${totalDuration}초`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <EyeOff className="h-3 w-3" />미열람
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    const comments = (r.report_comments as any[]) ?? [];
                    const approved = comments.filter((c: any) => c.reaction === "approved").length;
                    const rejected = comments.filter((c: any) => c.reaction === "rejected").length;
                    const total = comments.length;
                    if (total === 0) return <span className="text-xs text-muted-foreground">—</span>;
                    return (
                      <div className="flex items-center gap-2 text-xs">
                        {approved > 0 && <span className="flex items-center gap-0.5 text-emerald-600"><ThumbsUp className="h-3 w-3" />{approved}</span>}
                        {rejected > 0 && <span className="flex items-center gap-0.5 text-red-600"><ThumbsDown className="h-3 w-3" />{rejected}</span>}
                        {total > 0 && approved === 0 && rejected === 0 && <span className="flex items-center gap-0.5 text-muted-foreground"><MessageSquare className="h-3 w-3" />{total}</span>}
                      </div>
                    );
                  })()}
                </TableCell>
              </TableRow>
            );})}
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
