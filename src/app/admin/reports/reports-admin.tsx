"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ReportType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Upload } from "lucide-react";

interface Props {
  initialReports: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function ReportsAdmin({ initialReports, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);

  const openCreate = () => {
    setClientId(clients[0]?.id || "");
    setTitle(""); setSummary(""); setReportType("weekly");
    setPublishedAt(new Date().toISOString().split("T")[0]);
    setFile(null); setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title) { setError("제목은 필수입니다."); return; }
    if (!summary) { setError("요약은 필수입니다."); return; }
    if (!publishedAt) { setError("발행일은 필수입니다."); return; }
    if (!file) { setError("파일을 선택해주세요."); return; }

    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload file
      const filePath = `${clientId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, file);

      if (uploadError) {
        setError("파일 업로드 실패: " + uploadError.message);
        return;
      }

      // Create report record
      await supabase.from("reports").insert({
        client_id: clientId,
        report_type: reportType,
        title,
        summary,
        file_path: filePath,
        published_at: publishedAt,
        visibility: "visible",
        created_by: user.id,
      });

      setDialogOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> 리포트 추가</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>클라이언트</TableHead><TableHead>제목</TableHead>
            <TableHead>유형</TableHead><TableHead>발행일</TableHead>
            <TableHead>파일</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {initialReports.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow>
            ) : initialReports.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.clients?.name || "-"}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell><Badge variant="outline">{r.report_type}</Badge></TableCell>
                <TableCell className="text-sm">{formatDate(r.published_at)}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{r.file_path}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>리포트 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>클라이언트</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>제목 *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>요약 *</Label><Textarea value={summary} onChange={e => setSummary(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={reportType} onValueChange={v => setReportType(v as ReportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">주간</SelectItem>
                    <SelectItem value="monthly">월간</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>발행일 *</Label>
                <Input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>파일 *</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "업로드 중..." : "업로드"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
