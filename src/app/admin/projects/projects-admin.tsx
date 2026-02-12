"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProjectType, ProjectStage } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
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
import { Plus, Pencil } from "lucide-react";

interface Props {
  initialProjects: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function ProjectsAdmin({ initialProjects, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("website");
  const [stage, setStage] = useState<ProjectStage>("planning");
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [memo, setMemo] = useState("");

  const openCreate = () => {
    setEditing(null);
    setClientId(clients[0]?.id || "");
    setTitle(""); setProjectType("website"); setStage("planning");
    setProgress(0); setStartDate(""); setDueDate(""); setMemo("");
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setClientId(p.client_id); setTitle(p.title); setProjectType(p.project_type);
    setStage(p.stage); setProgress(p.progress);
    setStartDate(p.start_date || ""); setDueDate(p.due_date || "");
    setMemo(p.memo || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        title, project_type: projectType, stage, progress,
        start_date: startDate || null, due_date: dueDate || null,
        memo: memo || null,
      };

      if (editing) {
        await supabase.from("projects").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("projects").insert({
          ...payload, client_id: clientId, visibility: "visible", created_by: user.id,
        });
      }
      setDialogOpen(false);
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> 프로젝트 추가</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>클라이언트</TableHead><TableHead>제목</TableHead>
            <TableHead>유형</TableHead><TableHead>단계</TableHead>
            <TableHead>진행률</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {initialProjects.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow>
            ) : initialProjects.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>{p.clients?.name || "-"}</TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell><Badge variant="outline">{p.project_type}</Badge></TableCell>
                <TableCell><StatusBadge status={p.stage} /></TableCell>
                <TableCell>{p.progress}%</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "프로젝트 수정" : "프로젝트 추가"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>클라이언트</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2"><Label>제목</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={projectType} onValueChange={v => setProjectType(v as ProjectType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">웹사이트</SelectItem>
                    <SelectItem value="landing">랜딩페이지</SelectItem>
                    <SelectItem value="promotion">프로모션</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>단계</Label>
                <Select value={stage} onValueChange={v => setStage(v as ProjectStage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">기획</SelectItem>
                    <SelectItem value="design">디자인</SelectItem>
                    <SelectItem value="dev">개발</SelectItem>
                    <SelectItem value="qa">QA</SelectItem>
                    <SelectItem value="done">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>진행률 ({progress}%)</Label>
              <Input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>시작일</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>마감일</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>메모</Label><Textarea value={memo} onChange={e => setMemo(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading || !title}>{loading ? "저장 중..." : "저장"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
