import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { AddonStoreClient } from "./AddonStoreClient";

export const metadata: Metadata = {
  title: "부가 서비스 스토어 | Onecation",
  description: "추가 서비스 신청",
};

export default async function AddonPage() {
  await requireClient();
  return <AddonStoreClient />;
}
