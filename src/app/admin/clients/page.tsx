import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ClientsAdmin } from "./clients-admin";
import { calcHealthScore, type HealthScoreResult } from "@/lib/health-score";

export const metadata: Metadata = {
  title: "클라이언트 관리 | Onecation 관리자",
  description: "클라이언트 목록 및 설정",
};

export default async function AdminClientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // 클라이언트 목록 + 헬스 스코어용 데이터를 병렬로 패치
  const [
    clientsRes,
    reportsRes,
    notiRes,
    actionsRes,
    integrationsRes,
    profilesRes,
  ] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    // 클라이언트별 최신 리포트 발행일
    supabase.from("reports").select("client_id, published_at").order("published_at", { ascending: false }),
    // 클라이언트별 최근 알림톡 성공 발송일
    supabase
      .from("notification_logs")
      .select("client_id, created_at")
      .eq("success", true)
      .order("created_at", { ascending: false }),
    // 이번 달 실행 항목
    supabase
      .from("actions")
      .select("client_id, status")
      .gte("action_date", monthStart)
      .eq("visibility", "visible"),
    // 데이터 연동 상태
    supabase.from("data_integrations").select("client_id, status"),
    // 클라이언트 역할 프로필 (user_id 확보용)
    supabase.from("profiles").select("user_id, client_id").eq("role", "client").not("client_id", "is", null),
  ]);

  const clients = clientsRes.data || [];

  // ── 데이터별 인덱스 구성 ──

  // 최신 리포트: client_id → published_at
  const lastReportByClient: Record<string, string> = {};
  for (const r of reportsRes.data || []) {
    if (!r.client_id || lastReportByClient[r.client_id]) continue;
    lastReportByClient[r.client_id] = r.published_at;
  }

  // 최근 알림톡: client_id → created_at
  const lastAlimtalkByClient: Record<string, string> = {};
  for (const n of notiRes.data || []) {
    if (!n.client_id || lastAlimtalkByClient[n.client_id]) continue;
    lastAlimtalkByClient[n.client_id] = n.created_at;
  }

  // 이번 달 실행 항목: client_id → { total, done }
  const executionByClient: Record<string, { total: number; done: number }> = {};
  for (const a of actionsRes.data || []) {
    if (!a.client_id) continue;
    if (!executionByClient[a.client_id]) executionByClient[a.client_id] = { total: 0, done: 0 };
    executionByClient[a.client_id].total++;
    if (a.status === "done") executionByClient[a.client_id].done++;
  }

  // 연동 상태: client_id → boolean | null
  const integrationByClient: Record<string, boolean | null> = {};
  for (const i of integrationsRes.data || []) {
    if (!i.client_id) continue;
    const prev = integrationByClient[i.client_id];
    // 이미 true(활성)면 그대로
    if (prev === true) continue;
    if (i.status === "active") {
      integrationByClient[i.client_id] = true;
    } else {
      // 비활성 연동: null이면 false로 (적어도 연동 시도는 했음)
      if (prev === undefined || prev === null) {
        integrationByClient[i.client_id] = false;
      }
    }
  }

  // 클라이언트 마지막 로그인: auth.users.last_sign_in_at 활용
  const lastLoginByClient: Record<string, string | null> = {};
  try {
    const serviceClient = await createServiceClient();
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const loginByUserId: Record<string, string | null> = {};
    for (const u of authData?.users || []) {
      loginByUserId[u.id] = u.last_sign_in_at ?? null;
    }
    for (const p of profilesRes.data || []) {
      if (!p.client_id) continue;
      const login = loginByUserId[p.user_id] ?? null;
      const current = lastLoginByClient[p.client_id] ?? null;
      if (!current || (login && login > current)) {
        lastLoginByClient[p.client_id] = login;
      }
    }
  } catch {
    // 서비스 키 없거나 실패 시 로그인 점수 0으로 처리
  }

  // ── 헬스 스코어 계산 ──
  const healthScores: Record<string, HealthScoreResult> = {};
  for (const client of clients) {
    const hasIntegration =
      integrationByClient[client.id] !== undefined
        ? integrationByClient[client.id]
        : null; // 연동 자체 없음 → N/A

    healthScores[client.id] = calcHealthScore({
      lastReportDate: lastReportByClient[client.id] ?? null,
      lastAlimtalkDate: lastAlimtalkByClient[client.id] ?? null,
      executionThisMonth: executionByClient[client.id] ?? { total: 0, done: 0 },
      hasIntegration,
      lastClientLogin: lastLoginByClient[client.id] ?? null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">클라이언트 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">
          클라이언트를 추가하고, 클릭하면 상세 설정(KPI·지표·실행항목 등)을 관리할 수 있습니다.
        </p>
      </div>
      <ClientsAdmin initialClients={clients} healthScores={healthScores} />
    </div>
  );
}
