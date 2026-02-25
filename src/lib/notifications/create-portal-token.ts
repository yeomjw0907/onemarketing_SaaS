/**
 * 알림톡 매직링크용 포털 토큰 발급
 * welcome, action_status, event_reminder, addon_order_client 등에서 사용
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateSecureToken } from "./tokens";
import { buildPortalViewUrl } from "./tokens";

const PORTAL_TOKEN_VALID_DAYS = 7;

export type PortalPath = "overview" | "execution" | "timeline";

export async function createPortalToken(
  supabase: SupabaseClient,
  clientId: string,
  path: PortalPath
): Promise<{ token: string; url: string }> {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PORTAL_TOKEN_VALID_DAYS);

  const { error } = await supabase.from("client_portal_tokens").insert({
    token,
    client_id: clientId,
    path,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;

  return { token, url: buildPortalViewUrl(token) };
}
