import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { Asset, AssetCollection } from "@/lib/types/database";
import { AssetsClient } from "./assets-client";

export const metadata: Metadata = {
  title: "자료실 | Onecation",
  description: "브랜드 에셋 자료실",
};

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
function isImage(filePath: string) {
  return IMAGE_EXTS.has(filePath.split(".").pop()?.toLowerCase() ?? "");
}

export default async function AssetsPage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "assets")) {
    return <ModuleDisabled />;
  }

  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  // 병렬 조회
  const [assetsRes, collectionsRes, itemsRes] = await Promise.all([
    supabase
      .from("assets")
      .select("*")
      .eq("client_id", clientId)
      .eq("visibility", "visible")
      .order("created_at", { ascending: false }),
    supabase
      .from("asset_collections")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order"),
    supabase
      .from("asset_collection_items")
      .select("collection_id, asset_id"),
  ]);

  const assets = (assetsRes.data ?? []) as Asset[];
  const collections = (collectionsRes.data ?? []) as AssetCollection[];
  const collectionItems = (itemsRes.data ?? []) as { collection_id: string; asset_id: string }[];

  // 이미지 에셋에 대한 서명 URL 사전 생성 (썸네일용)
  const imageAssets = assets.filter((a) => isImage(a.file_path));
  let imageUrlMap: Record<string, string> = {};

  if (imageAssets.length > 0) {
    try {
      const serviceSupa = await createServiceClient();
      const paths = imageAssets.map((a) => a.file_path.replace(/^\/+/, ""));
      const { data: signedData } = await serviceSupa.storage
        .from("assets")
        .createSignedUrls(paths, 3600);

      if (signedData) {
        for (const item of signedData) {
          const matched = imageAssets.find(
            (a) => a.file_path.replace(/^\/+/, "") === item.path
          );
          if (matched && item.signedUrl) {
            imageUrlMap[matched.id] = item.signedUrl;
          }
        }
      }
    } catch {
      // 서비스 키 미설정 등 실패 시 썸네일 없이 렌더링
    }
  }

  return (
    <AssetsClient
      assets={assets}
      collections={collections}
      collectionItems={collectionItems}
      imageUrlMap={imageUrlMap}
    />
  );
}
