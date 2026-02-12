"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Action, ActionStatus } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil } from "lucide-react";

interface Props {
  initialActions: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function ActionsAdmin({ initialActions, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState<ActionStatus>("planned");
  const [actionDate, setActionDate] = useState(new Date().toISOString().split("T")[0]);

  const openCreate = () => {
    setEditing(null);
    setClientId(clients[0]?.id || "");
    setTitle("");
    setDescription("");
    setCategory("general");
    setStatus("planned");
    setActionDate(new Date().toISOString().split("T")[0]);
    setDialogOpen(true);
  };

  const openEdit = (action: any) => {
    setEditing(action);
    setClientId(action.client_id);
    setTitle(action.title);
    setDescription(action.description || "");
    setCategory(action.category);
    setStatus(action.status);
    setActionDate(action.action_date);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editing) {
        await supabase.from("actions").update({
          title,
          description: description || null,
          category,
          status,
          action_date: actionDate,
        }).eq("id", editing.id);
      } else {
        await supabase.from("actions").insert({
          client_id: clientId,
          title,
          description: description || null,
          category,
          status,
          action_date: actionDate,
          created_by: user.id,
          visibility: "visible",
        });
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Action 추가
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    등록된 액션이 없습니다.
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
                      <Button variant="ghost" size="icon" onClick={() => openEdit(action)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Action 수정" : "Action 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
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
            )}
            <div className="space-y-2">
              <Label>제목</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">계획됨</SelectItem>
                    <SelectItem value="in_progress">진행중</SelectItem>
                    <SelectItem value="done">완료</SelectItem>
                    <SelectItem value="hold">보류</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>날짜</Label>
              <Input type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading || !title || !clientId}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
