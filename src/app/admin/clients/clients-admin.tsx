"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Client, EnabledModules } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
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
import { Plus, Pencil, Eye } from "lucide-react";

const defaultModules: EnabledModules = {
  overview: true,
  execution: true,
  calendar: true,
  projects: true,
  reports: true,
  assets: true,
  support: true,
};

const moduleLabels: Record<keyof EnabledModules, string> = {
  overview: "Overview",
  execution: "Execution",
  calendar: "Calendar",
  projects: "Projects",
  reports: "Reports",
  assets: "Assets",
  support: "Support",
};

interface Props {
  initialClients: Client[];
}

export function ClientsAdmin({ initialClients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [clients, setClients] = useState(initialClients);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [kakaoUrl, setKakaoUrl] = useState("");
  const [modules, setModules] = useState<EnabledModules>(defaultModules);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setClientCode("");
    setKakaoUrl("");
    setModules(defaultModules);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setClientCode(client.client_code);
    setKakaoUrl(client.kakao_chat_url || "");
    setModules(client.enabled_modules as EnabledModules);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("clients")
          .update({
            name,
            kakao_chat_url: kakaoUrl || null,
            enabled_modules: modules,
          })
          .eq("id", editing.id);
        if (!error) {
          router.refresh();
          setDialogOpen(false);
        }
      } else {
        const { error } = await supabase.from("clients").insert({
          name,
          client_code: clientCode.toLowerCase(),
          kakao_chat_url: kakaoUrl || null,
          enabled_modules: modules,
          is_active: true,
        });
        if (!error) {
          router.refresh();
          setDialogOpen(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (key: keyof EnabledModules) => {
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
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
                <TableHead>이름</TableHead>
                <TableHead>코드</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>모듈</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    등록된 클라이언트가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {client.client_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "done" : "hold"}>
                        {client.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(client.enabled_modules as EnabledModules)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <Badge key={k} variant="outline" className="text-[10px]">
                              {k}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)} title="수정">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Shadow View"
                          onClick={() =>
                            window.open(
                              `/admin/preview?client=${client.id}`,
                              "_blank"
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "클라이언트 수정" : "클라이언트 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="회사명" />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>클라이언트 코드 (로그인 ID)</Label>
                <Input
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  placeholder="예: acme"
                />
                <p className="text-xs text-muted-foreground">
                  로그인 이메일: {clientCode || "code"}@onecation.client
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>카카오톡 상담 URL</Label>
              <Input
                value={kakaoUrl}
                onChange={(e) => setKakaoUrl(e.target.value)}
                placeholder="https://open.kakao.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>활성 모듈</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(moduleLabels) as (keyof EnabledModules)[]).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={modules[key]}
                      onChange={() => toggleModule(key)}
                      className="rounded"
                    />
                    {moduleLabels[key]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={loading || !name}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
