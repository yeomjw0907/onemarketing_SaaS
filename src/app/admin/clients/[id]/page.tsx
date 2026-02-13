import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ClientDetail } from "./client-detail";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function ClientDetailPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams?.catch(() => ({}));
  const initialTab = sp?.tab === "integrations" ? "integrations" : "kpis";
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  // 해당 클라이언트의 프로필(유저) 조회 — 비밀번호 리셋용
  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("user_id, email, display_name")
    .eq("client_id", id)
    .eq("role", "client")
    .single();

  // 관련 데이터 병렬 로드
  const [kpisRes, metricsRes, actionsRes, eventsRes, projectsRes, reportsRes, assetsRes, integrationsRes] =
    await Promise.all([
      supabase.from("kpi_definitions").select("*").eq("client_id", id).order("overview_order"),
      supabase.from("metrics").select("*").eq("client_id", id).order("period_start", { ascending: false }).limit(50),
      supabase.from("actions").select("*").eq("client_id", id).order("action_date", { ascending: false }).limit(50),
      supabase.from("calendar_events").select("*").eq("client_id", id).order("start_at", { ascending: false }).limit(50),
      supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("reports").select("*").eq("client_id", id).order("published_at", { ascending: false }).limit(50),
      supabase.from("assets").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("data_integrations").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    ]);

  return (
    <ClientDetail
      client={client}
      clientProfile={clientProfile || null}
      initialTab={initialTab}
      initialKpis={kpisRes.data || []}
      initialMetrics={metricsRes.data || []}
      initialActions={actionsRes.data || []}
      initialEvents={eventsRes.data || []}
      initialProjects={projectsRes.data || []}
      initialReports={reportsRes.data || []}
      initialAssets={assetsRes.data || []}
      initialIntegrations={integrationsRes.data || []}
    />
  );
}
