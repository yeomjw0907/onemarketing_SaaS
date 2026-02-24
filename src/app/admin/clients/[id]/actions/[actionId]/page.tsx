import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ActionEditor } from "../new/action-editor";

interface Props {
  params: Promise<{ id: string; actionId: string }>;
}

export default async function EditActionPage({ params }: Props) {
  await requireAdmin();
  const { id, actionId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, enabled_services")
    .eq("id", id)
    .single();

  const { data: action } = await supabase
    .from("actions")
    .select("*")
    .eq("id", actionId)
    .eq("client_id", id)
    .single();

  if (!client || !action) notFound();

  const enabledServices = (client.enabled_services || {}) as Record<string, boolean>;
  const enabledServiceKeys = Object.keys(enabledServices).filter((k) => enabledServices[k]);
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("client_id", id)
    .eq("visibility", "visible")
    .order("title", { ascending: true });

  return (
    <ActionEditor
      clientId={client.id}
      clientName={client.name}
      enabledServiceKeys={enabledServiceKeys.length > 0 ? enabledServiceKeys : ["general"]}
      projects={projects ?? []}
      action={action as any}
    />
  );
}
