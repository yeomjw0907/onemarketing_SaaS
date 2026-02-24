import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ActionEditor } from "./action-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewActionPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, enabled_services")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const enabledServices = (client.enabled_services || {}) as Record<string, boolean>;
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
      enabledServiceKeys={Object.keys(enabledServices).filter((k) => enabledServices[k])}
      projects={projects ?? []}
      action={null}
    />
  );
}
