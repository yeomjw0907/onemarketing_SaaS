"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AssetType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { safeFilePath } from "@/lib/utils";
import { Plus, Upload } from "lucide-react";

interface Props {
  initialAssets: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function AssetsAdmin({ initialAssets, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterClient, setFilterClient] = useState("all");

  const filteredAssets = filterClient === "all"
    ? initialAssets
    : initialAssets.filter((a: any) => a.client_id === filterClient);

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("other");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const openCreate = () => {
    setClientId(clients[0]?.id || "");
    setTitle(""); setAssetType("other"); setTags("");
    setFile(null); setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title) { setError("제목은 필수입니다."); return; }
    if (!file) { setError("파일을 선택해주세요."); return; }

    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filePath = safeFilePath(clientId, file.name);
      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, file);

      if (uploadError) { setError("업로드 실패: " + uploadError.message); return; }

      await supabase.from("assets").insert({
        client_id: clientId,
        asset_type: assetType,
        title,
        file_path: filePath,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        visibility: "visible",
        created_by: user.id,
      });

      setDialogOpen(false);
      router.refresh();
    } finally { setLoading(false); }
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
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> 에셋 추가</Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>클라이언트</TableHead><TableHead>제목</TableHead>
            <TableHead>유형</TableHead><TableHead>태그</TableHead>
            <TableHead>파일</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow>
            ) : filteredAssets.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>{a.clients?.name || "-"}</TableCell>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell><Badge variant="outline">{a.asset_type}</Badge></TableCell>
                <TableCell className="text-xs">{a.tags?.join(", ") || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{a.file_path}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>에셋 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>클라이언트</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>제목 *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>유형</Label>
              <Select value={assetType} onValueChange={v => setAssetType(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="logo">로고</SelectItem>
                  <SelectItem value="guideline">가이드라인</SelectItem>
                  <SelectItem value="font">폰트</SelectItem>
                  <SelectItem value="photo">사진</SelectItem>
                  <SelectItem value="video">영상</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>태그 (쉼표 구분)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="brand, logo, 2024" />
            </div>
            <div className="space-y-2">
              <Label>파일 *</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>
              <Upload className="h-4 w-4 mr-2" />{loading ? "업로드 중..." : "업로드"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
