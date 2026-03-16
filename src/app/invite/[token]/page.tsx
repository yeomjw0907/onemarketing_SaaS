import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InviteAcceptClient from "./invite-accept-client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // 토큰 유효성 검증
  const { data: invite } = await supabase
    .from("client_invite_tokens")
    .select("id, invited_email, client_id, used_at, expires_at, clients(name)")
    .eq("token", token)
    .single();

  if (!invite) {
    redirect("/login?invite_invalid=1");
  }

  if (invite.used_at) {
    redirect("/login?invite_used=1");
  }

  if (new Date(invite.expires_at) < new Date()) {
    redirect("/login?invite_expired=1");
  }

  const clientName = (invite.clients as { name?: string } | null)?.name ?? "";

  return (
    <InviteAcceptClient
      token={token}
      invitedEmail={invite.invited_email}
      clientName={clientName}
      clientId={invite.client_id}
    />
  );
}
