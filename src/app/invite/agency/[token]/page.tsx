import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AgencyInviteAccept from "./agency-invite-accept";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function AgencyInvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // 토큰 유효성 검증
  const { data: invite } = await supabase
    .from("agency_invite_tokens")
    .select("id, invited_email, invited_role, agency_id, used_at, expires_at, agencies(name)")
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

  const agencyName = (invite.agencies as { name?: string } | null)?.name ?? "";

  return (
    <AgencyInviteAccept
      token={token}
      invitedEmail={invite.invited_email}
      invitedRole={invite.invited_role}
      agencyName={agencyName}
      agencyId={invite.agency_id}
    />
  );
}
