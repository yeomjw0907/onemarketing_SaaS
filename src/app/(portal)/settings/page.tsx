import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";

/**
 * 환경설정 메뉴 제거에 따라 /settings 접근 시 마이페이지로 리다이렉트
 */
export default async function SettingsPage() {
  await requireClient();
  redirect("/mypage");
}
