"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AssetType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileItemCard } from "@/components/file-item-card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeFilePath } from "@/lib/utils";
import { Plus, Upload, Image } from "lucide-react";

const assetTypeLabels: Record<string, string> = {
  logo: "로고",
  guideline: "가이드라인",
  font: "폰트",
  photo: "사진",
  video: "영상",
  other: "기타",
};

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

  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("other");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const filteredAssets = filterClient === "all"
    ? initialAssets
    : initialAssets.filter((a: any) => a.client_id === filterClient);

  const assetTypes = Array.from(new Set(filteredAssets.map((a: any) => a.asset_type as string)));

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
      const { error: uploadError } = await supabase.storage.from("assets").upload(filePath, file);
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
      {/* 필터 + 추가 버튼 */}
      <div className="flex items-center gap-3">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="전체 클라이언트" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 클라이언트</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> 에셋 추가
          </Button>
        </div>
      </div>

      {/* 결과 요약 */}
      <p className="text-sm text-muted-foreground">
        {filterClient === "all"
          ? `전체 ${initialAssets.length}개`
          : `${clients.find(c => c.id === filterClient)?.name ?? ""} · ${filteredAssets.length}개`}
      </p>

      {/* 탭별 자료 목록 */}
      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Image className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">등록된 에셋이 없습니다</p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">
              전체 ({filteredAssets.length})
            </TabsTrigger>
            {assetTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {assetTypeLabels[type] || type} ({filteredAssets.filter((a: any) => a.asset_type === type).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-2">
              {filteredAssets.map((asset: any) => (
                <div key={asset.id} className="relative">
                  <FileItemCard
                    title={asset.title}
                    subtitle={asset.clients?.name ? `${asset.clients.name}${asset.tags?.length ? " · " + asset.tags.join(", ") : ""}` : asset.tags?.join(", ")}
                    date={asset.created_at}
                    badge={assetTypeLabels[asset.asset_type] || asset.asset_type}
                    bucket="assets"
                    filePath={asset.file_path}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          {assetTypes.map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="space-y-2">
                {filteredAssets
                  .filter((a: any) => a.asset_type === type)
                  .map((asset: any) => (
                    <FileItemCard
                      key={asset.id}
                      title={asset.title}
                      subtitle={asset.clients?.name ? `${asset.clients.name}${asset.tags?.length ? " · " + asset.tags.join(", ") : ""}` : asset.tags?.join(", ")}
                      date={asset.created_at}
                      badge={assetTypeLabels[asset.asset_type] || asset.asset_type}
                      bucket="assets"
                      filePath={asset.file_path}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* 에셋 추가 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>에셋 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>클라이언트</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="파일 제목" />
            </div>
            <div className="space-y-2">
              <Label>유형</Label>
              <Select value={assetType} onValueChange={v => setAssetType(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(assetTypeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
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
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "업로드 중..." : "업로드"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
