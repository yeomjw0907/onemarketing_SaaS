import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { EmptyState } from "@/components/empty-state";
import { FileItemCard } from "@/components/file-item-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image } from "lucide-react";
import { Asset } from "@/lib/types/database";

const assetTypeLabels: Record<string, string> = {
  logo: "로고",
  guideline: "가이드라인",
  font: "폰트",
  photo: "사진",
  video: "영상",
  other: "기타",
};

export default async function AssetsPage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "assets")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  const { data } = await supabase
    .from("assets")
    .select("*")
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .order("created_at", { ascending: false });

  const assets = (data || []) as Asset[];
  const assetTypes = Array.from(new Set(assets.map((a) => a.asset_type)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Image className="h-6 w-6" /> Assets
        </h1>
        <p className="text-muted-foreground text-sm mt-1">브랜드 에셋 자료실</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">전체 ({assets?.length || 0})</TabsTrigger>
          {assetTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {assetTypeLabels[type] || type} (
              {assets?.filter((a) => a.asset_type === type).length || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {assets && assets.length > 0 ? (
            <div className="space-y-3">
              {assets.map((asset) => (
                <FileItemCard
                  key={asset.id}
                  title={asset.title}
                  subtitle={asset.tags?.join(", ")}
                  badge={assetTypeLabels[asset.asset_type] || asset.asset_type}
                  bucket="assets"
                  filePath={asset.file_path}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="에셋 없음" description="등록된 에셋이 없습니다." />
          )}
        </TabsContent>

        {assetTypes.map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            <div className="space-y-3">
              {assets
                ?.filter((a) => a.asset_type === type)
                .map((asset) => (
                  <FileItemCard
                    key={asset.id}
                    title={asset.title}
                    subtitle={asset.tags?.join(", ")}
                    badge={assetTypeLabels[asset.asset_type] || asset.asset_type}
                    bucket="assets"
                    filePath={asset.file_path}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
