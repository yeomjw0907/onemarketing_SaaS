"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EventStatus } from "@/lib/types/database";
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
import { formatDateTime } from "@/lib/utils";
import { Plus, Pencil } from "lucide-react";

interface Props {
  initialEvents: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function CalendarAdmin({ initialEvents, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientActions, setClientActions] = useState<{ id: string; title: string }[]>([]);
  const [filterClient, setFilterClient] = useState("all");

  const filteredEvents = filterClient === "all"
    ? initialEvents
    : initialEvents.filter((e: any) => e.client_id === filterClient);

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [eventType, setEventType] = useState("task");
  const [status, setStatus] = useState<EventStatus>("planned");
  const [relatedActionIds, setRelatedActionIds] = useState<string[]>([]);

  useEffect(() => {
    if (clientId) {
      supabase
        .from("actions")
        .select("id, title")
        .eq("client_id", clientId)
        .order("action_date", { ascending: false })
        .limit(50)
        .then(({ data }) => setClientActions(data || []));
    }
  }, [clientId, supabase]);

  const openCreate = () => {
    setEditing(null);
    setClientId(clients[0]?.id || "");
    setTitle("");
    setDescription("");
    setStartAt("");
    setEndAt("");
    setEventType("task");
    setStatus("planned");
    setRelatedActionIds([]);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (event: any) => {
    setEditing(event);
    setClientId(event.client_id);
    setTitle(event.title);
    setDescription(event.description || "");
    setStartAt(event.start_at?.slice(0, 16) || "");
    setEndAt(event.end_at?.slice(0, 16) || "");
    setEventType(event.event_type);
    setStatus(event.status);
    setRelatedActionIds(event.related_action_ids || []);
    setError("");
    setDialogOpen(true);
  };

  const toggleActionId = (id: string) => {
    setRelatedActionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (relatedActionIds.length === 0) {
      setError("최소 1개의 관련 액션을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        title,
        description: description || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        event_type: eventType,
        status,
        related_action_ids: relatedActionIds,
      };

      if (editing) {
        await supabase.from("calendar_events").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("calendar_events").insert({
          ...payload,
          client_id: clientId,
          visibility: "visible",
          created_by: user.id,
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
      <div className="flex items-center justify-between gap-4">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="전체 클라이언트" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 클라이언트</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> 이벤트 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>클라이언트</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>시작</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관련 액션</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    등록된 이벤트가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.clients?.name || "-"}</TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(event.start_at)}</TableCell>
                    <TableCell><StatusBadge status={event.status} /></TableCell>
                    <TableCell className="text-sm">{event.related_action_ids?.length || 0}건</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "이벤트 수정" : "이벤트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                <Label>시작 시간</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종료 시간</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이벤트 타입</Label>
                <Input value={eventType} onChange={(e) => setEventType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">계획됨</SelectItem>
                    <SelectItem value="done">완료</SelectItem>
                    <SelectItem value="hold">보류</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>관련 액션 (최소 1개 필수)</Label>
              {clientActions.length > 0 ? (
                <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                  {clientActions.map((action) => (
                    <label key={action.id} className="flex items-center gap-2 text-sm py-0.5">
                      <input
                        type="checkbox"
                        checked={relatedActionIds.includes(action.id)}
                        onChange={() => toggleActionId(action.id)}
                      />
                      {action.title}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">클라이언트를 선택하면 액션 목록이 표시됩니다.</p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading || !title || !startAt}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
