import { requireClient, isModuleEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModuleDisabled } from "@/components/module-guard";
import { notFound } from "next/navigation";
import { ReportDetailView } from "./report-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: Props) {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "reports")) {
    return <ModuleDisabled />;
  }

  const { id } = await params;
  const supabase = await createClient();
  const clientId = session.profile.client_id!;

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .eq("visibility", "visible")
    .single();

  if (!report) notFound();

  return <ReportDetailView report={report} />;
}
