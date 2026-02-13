import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReportEditor } from "./report-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewReportPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("id", id)
    .single();

  if (!client) notFound();

  return <ReportEditor clientId={client.id} clientName={client.name} />;
}
