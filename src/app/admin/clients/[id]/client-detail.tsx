"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Client, EnabledModules, KpiDefinition, ActionStatus, PeriodType,
  EventStatus, ProjectType, ProjectStage, ReportType, AssetType,
  DataIntegration, IntegrationPlatform, IntegrationStatus,
  ExecutionTargets, ExecutionTargetEntry,
} from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime, formatPhoneDisplay, safeFilePath, cn } from "@/lib/utils";
import {
  ArrowLeft, Plus, Pencil, Save, Upload, KeyRound, Power, Check, X,
  Unplug, RefreshCw, Trash2, Zap, TestTube2, ExternalLink,
  LayoutDashboard, CalendarDays, FolderKanban, FileText, Image, MessageCircle,
  GripVertical, BarChart2, BookOpen, Settings, History,
  Users, Mail, Copy, Crown, ShieldCheck, Eye,
  BarChart3, Target, TrendingUp, Flag, Wallet, Layers, ToggleRight, Link2,
} from "lucide-react";
import { InstagramTab } from "./instagram-tab";
import { SERVICE_CATALOG, ALL_SERVICE_KEYS, defaultEnabledServices, findServiceItem } from "@/lib/service-catalog";
import { ServiceIcon } from "@/components/service-icon";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2 } from "lucide-react";

// ── 모듈 라벨 ──
const moduleLabels: Record<keyof EnabledModules, string> = {
  overview: "개요", execution: "실행 현황", calendar: "캘린더",
  projects: "프로젝트", reports: "리포트", assets: "자료실", support: "문의하기",
  timeline: "타임라인",
};

// ── KPI 표시명 ↔ Metric Key 매핑 (선택용) ──
const KPI_PRESETS: { key: string; label: string }[] = [
  { key: "sales", label: "매출액" },
  { key: "signup_count", label: "가입자 수" },
  { key: "conversions", label: "전환 수" },
  { key: "revenue", label: "매출(금액)" },
  { key: "orders", label: "주문 수" },
  { key: "page_views", label: "페이지뷰" },
  { key: "leads", label: "리드 수" },
  { key: "engagement_rate", label: "참여율" },
  { key: "other", label: "기타 (직접 입력)" },
];

const KPI_MAX_COUNT = 4;

// ── Props ──
interface Props {
  client: Client;
  clientProfile: { user_id: string; email: string; display_name: string } | null;
  initialTab?: string;
  initialKpis: KpiDefinition[];
  initialMetrics: any[];
  initialActions: any[];
  initialEvents: any[];
  initialProjects: any[];
  initialReports: any[];
  initialAssets: any[];
  initialIntegrations: DataIntegration[];
  initialIgAccounts?: any[];
}

export function ClientDetail({
  client, clientProfile,
  initialTab = "kpis",
  initialKpis, initialMetrics, initialActions,
  initialEvents, initialProjects, initialReports, initialAssets,
  initialIntegrations,
  initialIgAccounts = [],
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  // ── 사이드바 활성 섹션 ──
  const [activeSection, setActiveSection] = useState(initialTab || "kpis");

  // ── 상태 토글 ──
  const [isActive, setIsActive] = useState(client.is_active);
  const [statusLoading, setStatusLoading] = useState(false);

  const toggleStatus = async () => {
    setStatusLoading(true);
    await supabase.from("clients").update({ is_active: !isActive }).eq("id", client.id);
    setIsActive(!isActive);
    setStatusLoading(false);
    router.refresh();
  };

  // ── 비밀번호 리셋 ──
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [newPw, setNewPw] = useState("Admin123!");
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!clientProfile) return;
    setPwLoading(true); setPwMsg("");
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: clientProfile.user_id, newPassword: newPw }),
    });
    const data = await res.json();
    setPwMsg(res.ok ? "비밀번호가 리셋되었습니다." : data.error);
    setPwLoading(false);
  };

  // 로그인 이메일: profile에서 가져오거나, client_code 기반
  const displayEmail = clientProfile?.email || `${client.client_code}@onecation.co.kr`;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── 헤더 ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <Link href="/admin/clients" className="shrink-0">
          <Button variant="ghost" size="icon" className="mt-0.5" aria-label="클라이언트 목록으로"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{client.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{displayEmail}</code>
            {client.contact_name && <span>담당: {client.contact_name}</span>}
            {client.contact_phone && <span>{formatPhoneDisplay(client.contact_phone)}</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">등록일: {formatDate(client.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/admin/clients/${client.id}/portal-preview`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">포털 </span>미리보기
            </Button>
          </Link>
          {clientProfile && (
            <Button variant="outline" size="sm" onClick={() => { setPwDialogOpen(true); setPwMsg(""); }}>
              <KeyRound className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">비밀번호 </span>리셋
            </Button>
          )}
          <Button
            variant={isActive ? "outline" : "default"}
            size="sm"
            onClick={toggleStatus}
            disabled={statusLoading}
          >
            <Power className="h-3 w-3 mr-1" /> {isActive ? "비활성화" : "활성화"}
          </Button>
          <Badge variant={isActive ? "done" : "hold"} className="text-sm">
            {isActive ? "활성" : "비활성"}
          </Badge>
        </div>
      </div>

      {/* ── 사이드바 네비게이션 + 콘텐츠 ── */}
      {/* Mobile: compact scrollable tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
        {[
          { key: "kpis", label: "KPI 정의" },
          { key: "metrics", label: "성과 지표" },
          { key: "actions", label: "실행 항목" },
          { key: "executionTargets", label: "실행 목표" },
          { key: "adBudget", label: "광고 예산" },
          { key: "calendar", label: "캘린더" },
          { key: "projects", label: "프로젝트" },
          { key: "reports", label: "리포트" },
          { key: "assets", label: "자료실" },
          { key: "services", label: "이용중인 서비스" },
          { key: "modules", label: "활성 모듈" },
          { key: "integrations", label: "데이터 연동" },
          { key: "instagram", label: "Instagram" },
          { key: "team", label: "팀원" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeSection === s.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="hidden md:block w-52 shrink-0">
          <div className="space-y-1">
            {/* 성과 관리 */}
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">성과 관리</p>
            {[
              { key: "kpis", label: "KPI 정의", Icon: Target },
              { key: "metrics", label: "성과 지표", Icon: TrendingUp },
              { key: "actions", label: "실행 항목", Icon: Zap },
              { key: "executionTargets", label: "실행 목표", Icon: Flag },
              { key: "adBudget", label: "광고 예산", Icon: Wallet },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  activeSection === item.key
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <item.Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}

            {/* 운영 */}
            <div className="pt-3 mt-2 border-t border-border/40" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">운영</p>
            {[
              { key: "calendar", label: "캘린더", Icon: CalendarDays },
              { key: "projects", label: "프로젝트", Icon: FolderKanban },
              { key: "reports", label: "리포트", Icon: FileText },
              { key: "assets", label: "자료실", Icon: Image },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  activeSection === item.key
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <item.Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}

            {/* 설정 */}
            <div className="pt-3 mt-2 border-t border-border/40" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">설정</p>
            {[
              { key: "services", label: "이용중인 서비스", Icon: Layers },
              { key: "modules", label: "활성 모듈", Icon: ToggleRight },
              { key: "integrations", label: "데이터 연동", Icon: Link2 },
              { key: "instagram", label: "Instagram", Icon: BarChart2 },
              { key: "team", label: "팀원", Icon: Users },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  activeSection === item.key
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <item.Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {activeSection === "kpis" && <KpiTab clientId={client.id} initialKpis={initialKpis} supabase={supabase} router={router} />}
          {activeSection === "metrics" && <MetricTab clientId={client.id} initialMetrics={initialMetrics} kpiDefs={initialKpis} supabase={supabase} router={router} />}
          {activeSection === "actions" && <ActionTab clientId={client.id} initialActions={initialActions} supabase={supabase} router={router} />}
          {activeSection === "executionTargets" && <ExecutionTargetsTab clientId={client.id} initialTargets={(client.execution_targets || {}) as ExecutionTargets} supabase={supabase} router={router} />}
          {activeSection === "adBudget" && <AdBudgetTab clientId={client.id} initialBudget={(client.monthly_ad_budget || {}) as Record<string, number>} supabase={supabase} router={router} />}
          {activeSection === "calendar" && <CalendarTab clientId={client.id} initialEvents={initialEvents} projects={initialProjects} supabase={supabase} router={router} />}
          {activeSection === "projects" && <ProjectTab clientId={client.id} initialProjects={initialProjects} supabase={supabase} router={router} />}
          {activeSection === "reports" && <ReportTab clientId={client.id} initialReports={initialReports} supabase={supabase} router={router} />}
          {activeSection === "assets" && <AssetTab clientId={client.id} initialAssets={initialAssets} supabase={supabase} router={router} />}
          {activeSection === "integrations" && <IntegrationTab clientId={client.id} initialIntegrations={initialIntegrations} router={router} />}
          {activeSection === "instagram" && <InstagramTab clientId={client.id} initialAccounts={initialIgAccounts} />}
          {activeSection === "services" && <ServiceTab clientId={client.id} initialServices={(client.enabled_services || {}) as Record<string, boolean>} initialServiceUrls={(client.service_urls || {}) as Record<string, string>} supabase={supabase} router={router} />}
          {activeSection === "modules" && <ModuleTab clientId={client.id} initialModules={{ ...(client.enabled_modules || {}), overview: true, execution: true, calendar: true, projects: true, reports: true, assets: true, support: true, timeline: true } as EnabledModules} supabase={supabase} router={router} />}
          {activeSection === "team" && <ClientTeamTab clientId={client.id} />}
        </div>
      </div>

      {/* ── 비밀번호 리셋 다이얼로그 ── */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>비밀번호 리셋</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">대상: {clientProfile?.email}</p>
            <div className="space-y-2">
              <Label>새 비밀번호</Label>
              <Input value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            {pwMsg && <p className="text-sm text-center">{pwMsg}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialogOpen(false)}>닫기</Button>
            <Button onClick={handleResetPassword} disabled={pwLoading || newPw.length < 6}>
              {pwLoading ? "처리 중..." : "리셋"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ╔══════════════════════════════════════════════╗
// ║  KPI 정의 탭 (최대 4개, 드래그로 순서 변경)     ║
// ╚══════════════════════════════════════════════╝
function KpiTab({ clientId, initialKpis, supabase, router }: { clientId: string; initialKpis: KpiDefinition[]; supabase: any; router: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KpiDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [metricKey, setMetricKey] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [showOnOverview, setShowOnOverview] = useState(true);
  const [chartEnabled, setChartEnabled] = useState(false);
  const [description, setDescription] = useState("");
  const [presetSelect, setPresetSelect] = useState("");
  const sortedInitial = useMemo(() => [...(initialKpis || [])].sort((a, b) => (a.overview_order ?? 0) - (b.overview_order ?? 0)), [initialKpis]);
  const [orderedKpis, setOrderedKpis] = useState<KpiDefinition[]>(() => sortedInitial);
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!orderDirty && sortedInitial.length >= 0) setOrderedKpis(sortedInitial);
  }, [sortedInitial, orderDirty]);

  const isOther = presetSelect === "other";
  const atLimit = initialKpis.length >= KPI_MAX_COUNT;

  const openCreate = () => {
    if (atLimit) {
      alert(`KPI는 최대 ${KPI_MAX_COUNT}개까지 등록할 수 있습니다. 기존 항목을 수정·삭제한 후 추가해 주세요.`);
      return;
    }
    setEditing(null);
    setPresetSelect("");
    setMetricKey("");
    setMetricLabel("");
    setUnit("");
    setShowOnOverview(true);
    setChartEnabled(false);
    setDescription("");
    setDialogOpen(true);
  };
  const openEdit = (k: KpiDefinition) => { setEditing(k); setMetricKey(k.metric_key); setMetricLabel(k.metric_label); setUnit(k.unit); setShowOnOverview(k.show_on_overview); setChartEnabled(k.chart_enabled); setDescription(k.description || ""); setDialogOpen(true); };

  const onPresetChange = (value: string) => {
    setPresetSelect(value);
    if (value === "other") { setMetricKey(""); setMetricLabel(""); return; }
    const preset = KPI_PRESETS.find(p => p.key === value);
    if (preset) { setMetricKey(preset.key); setMetricLabel(preset.label); }
  };

  const handleSave = async () => {
    if (!editing && atLimit) return;
    setLoading(true);
    const newOrder = editing ? undefined : orderedKpis.length;
    if (editing) {
      await supabase.from("kpi_definitions").update({ metric_label: metricLabel, unit, show_on_overview: showOnOverview, chart_enabled: chartEnabled, description: description || null }).eq("id", editing.id);
    } else {
      await supabase.from("kpi_definitions").insert({ client_id: clientId, metric_key: metricKey, metric_label: metricLabel, unit, show_on_overview: showOnOverview, overview_order: newOrder ?? 0, chart_enabled: chartEnabled, description: description || null, validation_rule: { required: true } });
    }
    setDialogOpen(false);
    router.refresh();
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggingId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDraggingId(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id || id === targetId) return;
    const from = orderedKpis.findIndex((k) => k.id === id);
    const to = orderedKpis.findIndex((k) => k.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...orderedKpis];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    setOrderedKpis(next);
    setOrderDirty(true);
  };
  const handleDragEnd = () => { setDraggingId(null); };

  const saveOrder = async () => {
    setOrderSaving(true);
    for (let i = 0; i < orderedKpis.length; i++) {
      await supabase.from("kpi_definitions").update({ overview_order: i }).eq("id", orderedKpis[i].id);
    }
    setOrderDirty(false);
    router.refresh();
    setOrderSaving(false);
  };

  return (<>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">KPI 정의</h3>
      <div className="flex items-center gap-2">
        {atLimit && <span className="text-xs text-muted-foreground">KPI는 최대 {KPI_MAX_COUNT}개까지 등록 가능합니다.</span>}
        <Button size="sm" onClick={openCreate} disabled={atLimit} title={atLimit ? `최대 ${KPI_MAX_COUNT}개까지` : undefined}><Plus className="h-4 w-4 mr-1" /> 추가</Button>
        {orderDirty && <Button size="sm" variant="secondary" onClick={saveOrder} disabled={orderSaving}><Save className="h-4 w-4 mr-1" /> 순서 저장</Button>}
      </div>
    </div>
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9" />
              <TableHead>Key</TableHead>
              <TableHead>표시명</TableHead>
              <TableHead>단위</TableHead>
              <TableHead>개요</TableHead>
              <TableHead className="text-right">수정</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedKpis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  등록된 KPI가 없습니다. 위에서부터 1번 순서로 드래그하여 변경할 수 있습니다.
                </TableCell>
              </TableRow>
            ) : (
              orderedKpis.map((k, idx) => (
                <TableRow
                  key={k.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, k.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, k.id)}
                  onDragEnd={handleDragEnd}
                  className={cn("cursor-grab active:cursor-grabbing", draggingId === k.id && "opacity-50")}
                >
                  <TableCell className="w-9 p-1 text-muted-foreground"><GripVertical className="h-4 w-4" aria-hidden /></TableCell>
                  <TableCell><code className="text-xs bg-muted px-1 rounded">{k.metric_key}</code></TableCell>
                  <TableCell className="font-medium">{k.metric_label}</TableCell>
                  <TableCell>{k.unit}</TableCell>
                  <TableCell><Badge variant={k.show_on_overview ? "done" : "secondary"}>{k.show_on_overview ? "표시" : "숨김"}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(k)} aria-label="KPI 수정" draggable={false} onDragStart={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "KPI 수정" : "KPI 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
      <div className="space-y-2">
        <Label>표시명 (선택 시 Metric Key 자동 매핑) *</Label>
        {editing ? (
          <div className="flex gap-2"><Input value={metricLabel} readOnly className="bg-muted" /><code className="text-xs self-center text-muted-foreground">{metricKey}</code></div>
        ) : (
          <>
            <Select value={presetSelect} onValueChange={onPresetChange}>
              <SelectTrigger><SelectValue placeholder="표시명 선택" /></SelectTrigger>
              <SelectContent>
                {KPI_PRESETS.filter(p => p.key !== "other").map(p => (<SelectItem key={p.key} value={p.key}>{p.label} ({p.key})</SelectItem>))}
                <SelectItem value="other">기타 (직접 입력)</SelectItem>
              </SelectContent>
            </Select>
            {isOther && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1"><Label className="text-xs">표시명</Label><Input value={metricLabel} onChange={e => setMetricLabel(e.target.value)} placeholder="예: 커스텀 지표" /></div>
                <div className="space-y-1"><Label className="text-xs">Metric Key</Label><Input value={metricKey} onChange={e => setMetricKey(e.target.value.replace(/\s/g, "_").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())} placeholder="예: custom_metric" /></div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>단위</Label><Input value={unit} onChange={e => setUnit(e.target.value)} /></div><div className="space-y-2 pt-6"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showOnOverview} onChange={() => setShowOnOverview(!showOnOverview)} />개요 표시</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={chartEnabled} onChange={() => setChartEnabled(!chartEnabled)} />차트</label></div></div>
      <div className="space-y-2"><Label>설명</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
          <Button onClick={handleSave} disabled={loading || !metricKey || !metricLabel}>{loading ? "저장 중..." : "저장"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>);
}

// ╔══════════════════════════════════════════════╗
// ║  성과 지표 탭                                  ║
// ╚══════════════════════════════════════════════╝
function MetricTab({ clientId, initialMetrics, kpiDefs, supabase, router }: { clientId: string; initialMetrics: any[]; kpiDefs: KpiDefinition[]; supabase: any; router: any }) {
  const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("weekly"); const [periodStart, setPeriodStart] = useState(""); const [periodEnd, setPeriodEnd] = useState(""); const [metricKey, setMetricKey] = useState(""); const [value, setValue] = useState(""); const [notes, setNotes] = useState("");
  const openCreate = () => { setEditing(null); setPeriodType("weekly"); setPeriodStart(""); setPeriodEnd(""); setMetricKey(kpiDefs[0]?.metric_key || ""); setValue(""); setNotes(""); setDialogOpen(true); };
  const handleSave = async () => { setLoading(true); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    if (editing) { await supabase.from("metrics").update({ value: Number(value), notes: notes || null }).eq("id", editing.id); }
    else { await supabase.from("metrics").insert({ client_id: clientId, period_type: periodType, period_start: periodStart, period_end: periodEnd, metric_key: metricKey, value: Number(value), notes: notes || null, visibility: "visible", created_by: user.id }); }
    setDialogOpen(false); router.refresh(); setLoading(false); };
  return (<>
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">성과 지표</h3><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 추가</Button></div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>기간</TableHead><TableHead>지표</TableHead><TableHead>값</TableHead><TableHead>비고</TableHead><TableHead className="text-right">수정</TableHead></TableRow></TableHeader><TableBody>
      {initialMetrics.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">데이터 없음</TableCell></TableRow> : initialMetrics.map((m: any) => (
        <TableRow key={m.id}><TableCell><Badge variant="outline" className="text-xs mr-1">{m.period_type === "weekly" ? "주간" : "월간"}</Badge>{formatDate(m.period_start)}</TableCell><TableCell><code className="text-xs">{m.metric_key}</code></TableCell><TableCell className="font-medium">{Number(m.value).toLocaleString()}</TableCell><TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{m.notes || "-"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditing(m); setMetricKey(m.metric_key); setValue(m.value.toString()); setNotes(m.notes || ""); setDialogOpen(true); }} aria-label="성과지표 수정"><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "지표 수정" : "지표 추가"}</DialogTitle></DialogHeader><div className="space-y-4">
      {!editing && (<><div className="space-y-2"><Label>KPI</Label><Select value={metricKey} onValueChange={setMetricKey}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{kpiDefs.map(k => <SelectItem key={k.metric_key} value={k.metric_key}>{k.metric_label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>기간 타입</Label><Select value={periodType} onValueChange={v => setPeriodType(v as PeriodType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">주간</SelectItem><SelectItem value="monthly">월간</SelectItem></SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>시작일</Label><Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} /></div><div className="space-y-2"><Label>종료일</Label><Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} /></div></div></>)}
      <div className="space-y-2"><Label>값</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
      <div className="space-y-2"><Label>비고</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button><Button onClick={handleSave} disabled={loading}>{loading ? "저장 중..." : "저장"}</Button></DialogFooter></DialogContent></Dialog>
  </>);
}

// ╔══════════════════════════════════════════════╗
// ║  실행 항목 탭 (작성/수정은 전용 페이지에서)     ║
// ╚══════════════════════════════════════════════╝
function ActionTab({ clientId, initialActions, router }: { clientId: string; initialActions: any[]; supabase: any; router: any }) {
  return (<>
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">실행 항목</h3>
      <Button size="sm" type="button" onClick={() => router.push(`/admin/clients/${clientId}/actions/new`)}><Plus className="h-4 w-4 mr-1" /> 추가</Button>
    </div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>제목</TableHead><TableHead>카테고리</TableHead><TableHead>상태</TableHead><TableHead>날짜</TableHead><TableHead className="text-right">수정</TableHead></TableRow></TableHeader><TableBody>
      {initialActions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow> : initialActions.map((a: any) => (
        <TableRow key={a.id}><TableCell className="font-medium">{a.title}</TableCell><TableCell>{a.category}</TableCell><TableCell><StatusBadge status={a.status} /></TableCell><TableCell className="text-sm">{formatDate(a.action_date)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/admin/clients/${clientId}/actions/${a.id}`} aria-label="실행항목 수정"><Pencil className="h-4 w-4" /></Link></Button></TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
  </>);
}

// ╔══════════════════════════════════════════════╗
// ║  실행 목표 탭 (카테고리별 기간당 목표 건수)      ║
// ╚══════════════════════════════════════════════╝
function ExecutionTargetsTab({
  clientId,
  initialTargets,
  supabase,
  router,
}: {
  clientId: string;
  initialTargets: ExecutionTargets;
  supabase: any;
  router: any;
}) {
  const [targets, setTargets] = useState<ExecutionTargets>(() => ({ ...(initialTargets || {}) }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [categoryKey, setCategoryKey] = useState("");
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");
  const [targetCount, setTargetCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openAdd = () => {
    setEditingKey(null);
    setCategoryKey("");
    setPeriod("monthly");
    setTargetCount("");
    setError("");
    setDialogOpen(true);
  };
  const openEdit = (key: string, entry: ExecutionTargetEntry) => {
    setEditingKey(key);
    setCategoryKey(key);
    setPeriod(entry.period);
    setTargetCount(String(entry.target));
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const key = (editingKey || categoryKey).trim();
    const num = parseInt(targetCount, 10);
    if (!key) {
      setError("카테고리를 선택하세요.");
      return;
    }
    if (isNaN(num) || num < 1) {
      setError("목표 건수는 1 이상 숫자로 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const next: ExecutionTargets = { ...targets };
      if (editingKey && editingKey !== key) delete next[editingKey];
      next[key] = { period, target: num };
      const { error: err } = await supabase
        .from("clients")
        .update({ execution_targets: next })
        .eq("id", clientId);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setTargets(next);
      setDialogOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const entries = Object.entries(targets).filter(
    ([_, v]) => v && typeof v.target === "number" && v.target > 0
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">실행 목표</h3>
          <p className="text-sm text-muted-foreground">
            카테고리별 기간당 목표 건수를 설정하면 포털 실행 현황에서 진척도로 표시됩니다.
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> 목표 추가
        </Button>
      </div>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>목표 건수</TableHead>
                <TableHead className="text-right">수정 / 삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    등록된 목표가 없습니다. 목표 추가로 카테고리별 월/주 목표 건수를 설정하세요.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map(([key, entry]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">
                      {findServiceItem(key)?.label ?? key.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>{entry.period === "weekly" ? "이번 주" : "이번 달"}</TableCell>
                    <TableCell>{entry.target}건</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(key, entry)} aria-label="수정">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const next = { ...targets };
                            delete next[key];
                            setTargets(next);
                            supabase.from("clients").update({ execution_targets: next }).eq("id", clientId).then(() => router.refresh());
                          }}
                          aria-label="삭제"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKey ? "목표 수정" : "목표 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>카테고리 (서비스)</Label>
              <Select
                value={categoryKey}
                onValueChange={setCategoryKey}
                disabled={!!editingKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SERVICE_KEYS.map((k) => {
                    const item = findServiceItem(k);
                    return (
                      <SelectItem key={k} value={k}>
                        {item?.label ?? k.replace(/_/g, " ")}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>기간</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as "monthly" | "weekly")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">이번 달 (월별)</SelectItem>
                  <SelectItem value="weekly">이번 주 (주별)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>목표 건수</Label>
              <Input
                type="number"
                min={1}
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                placeholder="예: 25"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading || !categoryKey || !targetCount}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ╔══════════════════════════════════════════════╗
// ║  캘린더 탭                                     ║
// ╚══════════════════════════════════════════════╝
function CalendarTab({ clientId, initialEvents, projects, supabase, router }: { clientId: string; initialEvents: any[]; projects: { id: string; title: string }[]; supabase: any; router: any }) {
  const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState<any>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [eventType, setEventType] = useState("task"); const [status, setStatus] = useState<EventStatus>("planned"); const [projectId, setProjectId] = useState("");
  const toDateOnly = (iso: string | undefined) => (iso ? iso.slice(0, 10) : "");
  const openCreate = () => { setEditing(null); setTitle(""); setDescription(""); setStartDate(""); setEndDate(""); setEventType("task"); setStatus("planned"); setProjectId(""); setError(""); setDialogOpen(true); };
  const openEdit = (ev: any) => { setEditing(ev); setTitle(ev.title); setDescription(ev.description || ""); setStartDate(toDateOnly(ev.start_at)); setEndDate(toDateOnly(ev.end_at)); setEventType(ev.event_type); setStatus(ev.status); setProjectId(ev.project_id ?? ""); setError(""); setDialogOpen(true); };
  const handleSave = async () => { setLoading(true); setError(""); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setLoading(false); return; }
    const start_at = startDate ? new Date(startDate + "T00:00:00").toISOString() : "";
    const end_at = (endDate && endDate.trim()) ? new Date(endDate.trim() + "T23:59:59.999").toISOString() : null;
    const basePayload = { title, description: description || null, start_at, end_at, event_type: eventType, status, project_id: projectId && projectId.trim() ? projectId.trim() : null };
    if (editing) {
      const { error: err } = await supabase.from("calendar_events").update(basePayload).eq("id", editing.id);
      if (err) { setError(err.message || "저장에 실패했습니다."); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from("calendar_events").insert({ ...basePayload, related_action_ids: [], client_id: clientId, visibility: "visible", created_by: user.id });
      if (err) { setError(err.message || "저장에 실패했습니다."); setLoading(false); return; }
    }
    setDialogOpen(false); router.refresh(); setLoading(false); };
  return (<> 
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">캘린더</h3><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 추가</Button></div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>제목</TableHead><TableHead>시작</TableHead><TableHead>종료</TableHead><TableHead>상태</TableHead><TableHead className="text-right">수정</TableHead></TableRow></TableHeader><TableBody>
      {initialEvents.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow> : initialEvents.map((ev: any) => (
        <TableRow key={ev.id}><TableCell className="font-medium">{ev.title}</TableCell><TableCell className="text-sm">{formatDate(ev.start_at)}</TableCell><TableCell className="text-sm">{ev.end_at ? formatDate(ev.end_at) : "-"}</TableCell><TableCell><StatusBadge status={ev.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(ev)} aria-label="일정 수정"><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "수정" : "추가"}</DialogTitle></DialogHeader><div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2"><Label>제목</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="space-y-2"><Label>설명</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>시작일</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div><div className="space-y-2"><Label>종료일</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>일정 타입</Label><Select value={eventType} onValueChange={setEventType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="task">작업</SelectItem><SelectItem value="meeting">미팅</SelectItem><SelectItem value="deadline">마감일</SelectItem><SelectItem value="milestone">마일스톤</SelectItem><SelectItem value="other">기타</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>상태</Label><Select value={status} onValueChange={v => setStatus(v as EventStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">계획됨</SelectItem><SelectItem value="done">완료</SelectItem><SelectItem value="hold">보류</SelectItem></SelectContent></Select></div></div>
      <div className="space-y-2"><Label>연결 프로젝트</Label><Select value={projectId || "_none"} onValueChange={v => setProjectId(v === "_none" ? "" : v)}><SelectTrigger><SelectValue placeholder="선택 안 함" /></SelectTrigger><SelectContent><SelectItem value="_none">선택 안 함</SelectItem>{projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}</SelectContent></Select></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button><Button onClick={handleSave} disabled={loading || !title || !startDate}>{loading ? "저장 중..." : "저장"}</Button></DialogFooter></DialogContent></Dialog>
  </>);
}

// ╔══════════════════════════════════════════════╗
// ║  프로젝트 탭                                   ║
// ╚══════════════════════════════════════════════╝
function ProjectTab({ clientId, initialProjects, supabase, router }: { clientId: string; initialProjects: any[]; supabase: any; router: any }) {
  const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(""); const [projectType, setProjectType] = useState<ProjectType>("website"); const [stage, setStage] = useState<ProjectStage>("planning"); const [progress, setProgress] = useState(0); const [startDate, setStartDate] = useState(""); const [dueDate, setDueDate] = useState(""); const [memo, setMemo] = useState("");
  const openCreate = () => { setEditing(null); setTitle(""); setProjectType("website"); setStage("planning"); setProgress(0); setStartDate(""); setDueDate(""); setMemo(""); setDialogOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setTitle(p.title); setProjectType(p.project_type); setStage(p.stage); setProgress(p.progress); setStartDate(p.start_date || ""); setDueDate(p.due_date || ""); setMemo(p.memo || ""); setDialogOpen(true); };
  const handleSave = async () => { setLoading(true); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const payload = { title, project_type: projectType, stage, progress, start_date: startDate || null, due_date: dueDate || null, memo: memo || null };
    if (editing) { await supabase.from("projects").update(payload).eq("id", editing.id); }
    else { await supabase.from("projects").insert({ ...payload, client_id: clientId, visibility: "visible", created_by: user.id }); }
    setDialogOpen(false); router.refresh(); setLoading(false); };
  return (<>
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">프로젝트</h3><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 추가</Button></div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>제목</TableHead><TableHead>유형</TableHead><TableHead>단계</TableHead><TableHead>진행률</TableHead><TableHead>기간</TableHead><TableHead className="text-right">수정</TableHead></TableRow></TableHeader><TableBody>
      {initialProjects.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow> : initialProjects.map((p: any) => (
        <TableRow key={p.id}><TableCell className="font-medium">{p.title}</TableCell><TableCell><Badge variant="outline">{p.project_type}</Badge></TableCell><TableCell><StatusBadge status={p.stage} /></TableCell><TableCell>{p.progress}%</TableCell><TableCell className="text-xs">{p.start_date ? formatDate(p.start_date) : "-"} ~ {p.due_date ? formatDate(p.due_date) : "-"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="프로젝트 수정"><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "수정" : "추가"}</DialogTitle></DialogHeader><div className="space-y-4">
      <div className="space-y-2"><Label>제목</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>유형</Label><Select value={projectType} onValueChange={v => setProjectType(v as ProjectType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="website">웹사이트</SelectItem><SelectItem value="landing">랜딩페이지</SelectItem><SelectItem value="promotion">프로모션</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>단계</Label><Select value={stage} onValueChange={v => setStage(v as ProjectStage)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planning">기획</SelectItem><SelectItem value="design">디자인</SelectItem><SelectItem value="dev">개발</SelectItem><SelectItem value="qa">QA</SelectItem><SelectItem value="done">완료</SelectItem></SelectContent></Select></div></div>
      <div className="space-y-2"><Label>진행률 ({progress}%)</Label><Input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} /></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>시작일</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div><div className="space-y-2"><Label>마감일</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div></div>
      <div className="space-y-2"><Label>메모</Label><Textarea value={memo} onChange={e => setMemo(e.target.value)} /></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button><Button onClick={handleSave} disabled={loading || !title}>{loading ? "저장 중..." : "저장"}</Button></DialogFooter></DialogContent></Dialog>
  </>);
}

// ╔══════════════════════════════════════════════╗
// ║  리포트 탭 (전체 화면 작성 페이지로 이동)         ║
// ╚══════════════════════════════════════════════╝
function ReportTab({ clientId, initialReports, supabase, router }: { clientId: string; initialReports: any[]; supabase: any; router: any }) {
  return (<>
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">리포트</h3>
      <Button size="sm" type="button" onClick={() => router.push(`/admin/clients/${clientId}/reports/new`)}>
        <Plus className="h-4 w-4 mr-1" /> 리포트 작성
      </Button>
    </div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>제목</TableHead><TableHead>유형</TableHead><TableHead>발행일</TableHead><TableHead>파일</TableHead></TableRow></TableHeader><TableBody>
      {initialReports.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow> : initialReports.map((r: any) => (
        <TableRow key={r.id}><TableCell className="font-medium">{r.title}</TableCell><TableCell><Badge variant="outline">{r.report_type === "weekly" ? "주간" : "월간"}</Badge></TableCell><TableCell className="text-sm">{formatDate(r.published_at)}</TableCell><TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{r.file_path || r.summary?.slice(0, 50) || "-"}</TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
  </>);
}

// ╔══════════════════════════════════════════════╗
// ║  자료실 탭                                     ║
// ╚══════════════════════════════════════════════╝
// ── 컬렉션 색상 팔레트 ──
const COLLECTION_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#06b6d4", "#64748b",
];
const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: "로고", guideline: "가이드라인", font: "폰트",
  photo: "사진", video: "영상", other: "기타",
};

function AssetTab({ clientId, initialAssets, supabase, router }: {
  clientId: string; initialAssets: any[]; supabase: any; router: any;
}) {
  const [subTab, setSubTab] = useState<"files" | "collections">("files");

  // ── 파일 업로드 상태 ──
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("other");
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // ── 컬렉션 상태 ──
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionItems, setCollectionItems] = useState<{ collection_id: string; asset_id: string }[]>([]);
  const [colLoading, setColLoading] = useState(false);

  // 컬렉션 생성 다이얼로그
  const [colDialogOpen, setColDialogOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<any | null>(null);
  const [colName, setColName] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colColor, setColColor] = useState(COLLECTION_COLORS[0]!);
  const [colSaving, setColSaving] = useState(false);

  // 파일 할당 다이얼로그
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignColId, setAssignColId] = useState("");
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);

  // ── 초기 로드 ──
  useEffect(() => {
    loadCollections();
  }, [clientId]);

  const loadCollections = async () => {
    setColLoading(true);
    const [colRes, itemRes] = await Promise.all([
      supabase.from("asset_collections").select("*").eq("client_id", clientId).order("sort_order"),
      supabase.from("asset_collection_items").select("collection_id, asset_id"),
    ]);
    setCollections(colRes.data ?? []);
    setCollectionItems(itemRes.data ?? []);
    setColLoading(false);
  };

  // ── 파일 업로드 ──
  const addTag = () => { const v = tagInput.trim(); if (v && !tagList.includes(v)) { setTagList(p => [...p, v]); setTagInput(""); } };
  const removeTag = (i: number) => setTagList(p => p.filter((_, j) => j !== i));
  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } };

  const handleUpload = async () => {
    if (!title || !file) { setUploadError("제목과 파일은 필수입니다."); return; }
    setUploading(true); setUploadError("");
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const filePath = safeFilePath(clientId, file.name);
    const { error: upErr } = await supabase.storage.from("assets").upload(filePath, file);
    if (upErr) { setUploadError("업로드 실패: " + upErr.message); setUploading(false); return; }
    const tags = tagInput.trim() ? [...tagList, tagInput.trim()] : tagList;
    await supabase.from("assets").insert({ client_id: clientId, asset_type: assetType, title, file_path: filePath, tags, visibility: "visible", created_by: user.id });
    setUploadOpen(false); setUploading(false); router.refresh();
  };

  // ── 컬렉션 저장 ──
  const openNewCollection = () => {
    setEditingCol(null); setColName(""); setColDesc(""); setColColor(COLLECTION_COLORS[0]!); setColDialogOpen(true);
  };
  const openEditCollection = (col: any) => {
    setEditingCol(col); setColName(col.name); setColDesc(col.description ?? ""); setColColor(col.color); setColDialogOpen(true);
  };
  const handleSaveCollection = async () => {
    if (!colName.trim()) return;
    setColSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (editingCol) {
      await supabase.from("asset_collections").update({ name: colName.trim(), description: colDesc.trim() || null, color: colColor }).eq("id", editingCol.id);
    } else {
      await supabase.from("asset_collections").insert({ client_id: clientId, name: colName.trim(), description: colDesc.trim() || null, color: colColor, sort_order: collections.length, created_by: user?.id });
    }
    setColDialogOpen(false); setColSaving(false); loadCollections();
  };
  const handleDeleteCollection = async (colId: string) => {
    if (!confirm("컬렉션을 삭제하시겠습니까? 파일은 삭제되지 않습니다.")) return;
    await supabase.from("asset_collections").delete().eq("id", colId);
    loadCollections();
  };

  // ── 파일 할당 ──
  const openAssign = (colId: string) => {
    const already = new Set(collectionItems.filter(i => i.collection_id === colId).map(i => i.asset_id));
    setAssignColId(colId); setAssignSelected(already); setAssignOpen(true);
  };
  const toggleAssign = (assetId: string) => {
    setAssignSelected(prev => { const s = new Set(prev); s.has(assetId) ? s.delete(assetId) : s.add(assetId); return s; });
  };
  const handleSaveAssign = async () => {
    setAssignSaving(true);
    const current = new Set(collectionItems.filter(i => i.collection_id === assignColId).map(i => i.asset_id));
    const toAdd = [...assignSelected].filter(id => !current.has(id));
    const toRemove = [...current].filter(id => !assignSelected.has(id));
    if (toAdd.length) await supabase.from("asset_collection_items").insert(toAdd.map(asset_id => ({ collection_id: assignColId, asset_id })));
    if (toRemove.length) await supabase.from("asset_collection_items").delete().eq("collection_id", assignColId).in("asset_id", toRemove);
    setAssignOpen(false); setAssignSaving(false); loadCollections();
  };

  // ── 컬렉션별 파일 수 ──
  const itemCountByCol = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of collectionItems) m[it.collection_id] = (m[it.collection_id] ?? 0) + 1;
    return m;
  }, [collectionItems]);

  // ── 파일이 속한 컬렉션 목록 ──
  const colsByAsset = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const it of collectionItems) {
      if (!m[it.asset_id]) m[it.asset_id] = [];
      const col = collections.find(c => c.id === it.collection_id);
      if (col) m[it.asset_id]!.push(col.name);
    }
    return m;
  }, [collectionItems, collections]);

  return (
    <>
      {/* 서브 탭 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {(["files", "collections"] as const).map(t => (
            <button key={t} type="button" onClick={() => setSubTab(t)}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                subTab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {t === "files" ? `파일 (${initialAssets.length})` : `컬렉션 (${collections.length})`}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={subTab === "files" ? () => { setTitle(""); setAssetType("other"); setTagList([]); setTagInput(""); setFile(null); setUploadError(""); setUploadOpen(true); } : openNewCollection}>
          <Plus className="h-4 w-4 mr-1" />{subTab === "files" ? "파일 추가" : "컬렉션 추가"}
        </Button>
      </div>

      {/* ── 파일 탭 ── */}
      {subTab === "files" && (
        <Card><CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>제목</TableHead><TableHead>유형</TableHead>
              <TableHead>컬렉션</TableHead><TableHead>태그</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {initialAssets.length === 0
                ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">파일 없음</TableCell></TableRow>
                : initialAssets.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(colsByAsset[a.id] ?? []).map(n => (
                          <span key={n} className="text-[10px] bg-primary/8 text-primary px-1.5 py-0.5 rounded-full font-medium">{n}</span>
                        ))}
                        {(colsByAsset[a.id] ?? []).length === 0 && <span className="text-xs text-muted-foreground">미분류</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.tags?.join(", ") || "-"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {/* ── 컬렉션 탭 ── */}
      {subTab === "collections" && (
        <div>
          {colLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : collections.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Image className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">컬렉션이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">컬렉션을 만들어 파일을 목적별로 묶어보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.map(col => {
                const count = itemCountByCol[col.id] ?? 0;
                const assetIds = collectionItems.filter(i => i.collection_id === col.id).map(i => i.asset_id);
                const previewFiles = initialAssets.filter(a => assetIds.includes(a.id)).slice(0, 4);
                return (
                  <Card key={col.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* 컬러 마커 */}
                        <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: col.color + "20", border: `2px solid ${col.color}40` }}>
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{col.name}</p>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{count}개</span>
                          </div>
                          {col.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{col.description}</p>}
                          {/* 미리보기 파일명 */}
                          {previewFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {previewFiles.map(f => (
                                <span key={f.id} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {f.title}
                                </span>
                              ))}
                              {count > 4 && <span className="text-[10px] text-muted-foreground">+{count - 4}개</span>}
                            </div>
                          )}
                        </div>
                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openAssign(col.id)}>
                            파일 설정
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditCollection(col)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteCollection(col.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 파일 업로드 다이얼로그 ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>파일 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>제목 *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>유형</Label>
              <Select value={assetType} onValueChange={v => setAssetType(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>태그 (엔터로 추가)</Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
                {tagList.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">{t}
                    <button type="button" onClick={() => removeTag(i)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKey}
                  placeholder={tagList.length === 0 ? "태그 입력 후 엔터" : ""} className="flex-1 min-w-[100px] outline-none bg-transparent text-sm" />
              </div>
            </div>
            <div className="space-y-2"><Label>파일 *</Label><Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>취소</Button>
            <Button onClick={handleUpload} disabled={uploading}><Upload className="h-4 w-4 mr-1" />{uploading ? "업로드 중..." : "업로드"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 컬렉션 생성/편집 다이얼로그 ── */}
      <Dialog open={colDialogOpen} onOpenChange={setColDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingCol ? "컬렉션 편집" : "컬렉션 추가"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>이름 *</Label><Input value={colName} onChange={e => setColName(e.target.value)} placeholder="예: 2025 여름 캠페인" /></div>
            <div className="space-y-2"><Label>설명 (선택)</Label><Input value={colDesc} onChange={e => setColDesc(e.target.value)} placeholder="컬렉션 설명" /></div>
            <div className="space-y-2">
              <Label>컬러</Label>
              <div className="flex gap-2 flex-wrap">
                {COLLECTION_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColColor(c)}
                    className={cn("h-7 w-7 rounded-full border-2 transition-all", colColor === c ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColDialogOpen(false)}>취소</Button>
            <Button onClick={handleSaveCollection} disabled={colSaving || !colName.trim()}>
              {colSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 파일 할당 다이얼로그 ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>파일 설정 — {collections.find(c => c.id === assignColId)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {initialAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">업로드된 파일이 없습니다</p>
            ) : initialAssets.map((a: any) => {
              const checked = assignSelected.has(a.id);
              return (
                <button key={a.id} type="button" onClick={() => toggleAssign(a.id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                    checked ? "bg-primary/8" : "hover:bg-muted/60")}>
                  <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                    checked ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                    {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>취소</Button>
            <Button onClick={handleSaveAssign} disabled={assignSaving}>
              {assignSaving ? "저장 중..." : `적용 (${assignSelected.size}개)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ╔══════════════════════════════════════════════╗
// ║  서비스 항목 탭 (관리자 on/off + 서비스별 URL)   ║
// ╚══════════════════════════════════════════════╝
function ServiceTab({ clientId, initialServices, initialServiceUrls, supabase, router }: { clientId: string; initialServices: Record<string, boolean>; initialServiceUrls?: Record<string, string>; supabase: any; router: any }) {
  const [services, setServices] = useState<Record<string, boolean>>(() => {
    const merged = { ...defaultEnabledServices() };
    for (const [k, v] of Object.entries(initialServices || {})) { merged[k] = v; }
    return merged;
  });
  const [urls, setUrls] = useState<Record<string, string>>(() => ({ ...(initialServiceUrls || {}) }));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggle = (key: string) => { setServices(prev => ({ ...prev, [key]: !prev[key] })); setSaved(false); setError(""); };
  const setUrl = (key: string, value: string) => { setUrls(prev => ({ ...prev, [key]: value })); setSaved(false); };

  const handleSave = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/update-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, enabledServices: services, serviceUrls: urls }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSaved(true); router.refresh();
    } catch { setError("저장 중 오류 발생"); } finally { setLoading(false); }
  };

  const activeCount = Object.values(services).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">서비스 항목</h3>
          <p className="text-sm text-muted-foreground">{activeCount}개 활성화 · 고객 포털에서 바로가기 링크로 연결됩니다</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-1" /> {loading ? "저장 중..." : "저장"}
        </Button>
      </div>
      {saved && <p className="text-sm text-green-600">저장되었습니다.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-6">
        {SERVICE_CATALOG.map(cat => (
          <div key={cat.key}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat.label}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cat.items.map(item => (
                <div
                  key={item.key}
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    services[item.key]
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border/60 bg-muted/30"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={services[item.key] || false} onChange={() => toggle(item.key)} className="sr-only" />
                    <ServiceIcon iconKey={item.iconKey} color={item.color} size="sm" className={!services[item.key] ? "opacity-40" : ""} />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    <div className={`h-5 w-9 rounded-full relative transition-colors ${services[item.key] ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${services[item.key] ? "left-[18px]" : "left-0.5"}`} />
                    </div>
                  </label>
                  {services[item.key] && (
                    <div className="pl-9">
                      <label className="text-xs text-muted-foreground block mb-1">바로가기 URL (선택)</label>
                      <Input
                        type="url"
                        value={urls[item.key] || ""}
                        onChange={e => setUrl(item.key, e.target.value)}
                        placeholder="https://..."
                        className="text-sm h-8"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════════╗
// ║  데이터 연동 탭                                 ║
// ╚══════════════════════════════════════════════╝

// ── 플랫폼별 값 넣는 위치 가이드 (관리자 데이터 연동 탭 내 표시용) ──
const INTEGRATION_GUIDES: Record<string, { title: string; env?: string[]; steps: string[]; fields: { name: string; where: string }[] }> = {
  naver_ads: {
    title: "네이버 검색광고",
    env: [],
    steps: [
      "네이버 검색광고에 광고주로 가입 후 로그인",
      "도구 → API 관리 → 라이선스 발급",
      "발급된 API Key, Secret Key, Customer ID를 아래 입력란에 넣습니다.",
    ],
    fields: [
      { name: "API Key", where: "네이버 검색광고 API 관리 → 라이선스 발급 후 표시되는 API Key" },
      { name: "Secret Key", where: "같은 화면에서 발급된 Secret Key (한 번만 표시되므로 안전하게 보관)" },
      { name: "Customer ID", where: "네이버 검색광고 계정의 고객 ID (숫자, API 관리 화면 또는 계정 설정에서 확인)" },
    ],
  },
  meta_ads: {
    title: "Meta 광고 (Facebook/Instagram)",
    env: ["META_APP_ID", "META_APP_SECRET", "NEXT_PUBLIC_APP_URL (OAuth 콜백용)"],
    steps: [
      "권장: 상단 [Meta OAuth] 버튼 클릭 → App ID 입력(.env.local의 META_APP_ID) → Facebook 인증 → 돌아온 뒤 광고 계정 ID만 아래에 입력 후 연동 저장",
      "또는 Meta for Developers에서 앱 생성 후 액세스 토큰·광고 계정 ID를 직접 발급해 입력",
      "광고 계정 ID: Meta 비즈니스 설정 → 광고 계정 → ID 확인 (act_숫자 형식)",
    ],
    fields: [
      { name: "Access Token", where: "Meta OAuth 버튼 사용 시 자동. 직접 입력 시 Developers 앱에서 토큰 생성" },
      { name: "Ad Account ID", where: "business.facebook.com → 설정 → 광고 계정 → 광고 계정 ID (act_123456789)" },
    ],
  },
  google_ads: {
    title: "Google Ads",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL", "GOOGLE_DEVELOPER_TOKEN(선택, .env에 넣으면 연동마다 입력 안 함)"],
    steps: [
      "상단 [Google OAuth] 버튼 클릭 → Client ID 입력(.env.local의 GOOGLE_CLIENT_ID) → Google 로그인 동의",
      "돌아온 URL에 googleRefreshToken=... 이 붙어 있으므로 복사해 아래 Refresh Token란에 붙여넣기",
      "Customer ID: ads.google.com → 도구 및 설정 → 설정에서 확인. Developer Token: API 센터에서 발급 (또는 .env에 GOOGLE_DEVELOPER_TOKEN 한 번 넣으면 연동마다 입력 생략)",
    ],
    fields: [
      { name: "Refresh Token", where: "Google OAuth 후 리다이렉트 URL의 googleRefreshToken 값 복사" },
      { name: "Customer ID", where: "Google Ads → 도구 및 설정 → 설정 → 고객 ID (123-456-7890 또는 숫자만)" },
      { name: "Developer Token", where: "API 센터에서 발급. .env에 GOOGLE_DEVELOPER_TOKEN 넣으면 여기 비워도 됨(원케이션 1세트)" },
    ],
  },
  google_analytics: {
    title: "Google Analytics (GA4)",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"],
    steps: [
      "Google OAuth는 Google Ads와 동일. Refresh Token은 위 [Google OAuth]로 발급 후 URL에서 복사",
      "Property ID: GA4 관리 → 속성 → 속성 설정 → 속성 ID (숫자). 입력 시 properties/123456789 형식",
    ],
    fields: [
      { name: "Refresh Token", where: "Google OAuth 버튼으로 인증 후 URL의 googleRefreshToken 복사" },
      { name: "Property ID", where: "GA4 관리 → 속성 → 속성 설정 → 속성 ID → properties/숫자 형식으로 입력" },
    ],
  },
  google_search_console: {
    title: "Google Search Console (SEO)",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"],
    steps: [
      "Google OAuth 버튼으로 인증 후 Refresh Token 복사 (Google Ads·GA4와 동일한 OAuth 계정 사용 가능)",
      "Site URL: Search Console에서 확인할 속성 URL (예: https://example.com/ 또는 sc-domain:example.com)",
    ],
    fields: [
      { name: "Refresh Token", where: "Google OAuth 버튼으로 인증 후 URL의 googleRefreshToken 복사" },
      { name: "Site URL", where: "Search Console → 속성 선택 → URL 그대로 복사 (https://... 또는 sc-domain:...)" },
    ],
  },
  kakao_moment: {
    title: "카카오모먼트 (Kakao Moment)",
    env: [],
    steps: [
      "카카오 비즈니스(https://business.kakao.com) → 카카오모먼트 → API 설정에서 액세스 토큰 발급",
      "광고 계정 ID: 카카오모먼트 대시보드 URL 또는 설정에서 확인",
    ],
    fields: [
      { name: "Access Token", where: "카카오 비즈니스 → 카카오모먼트 → API 설정 → 액세스 토큰" },
      { name: "Ad Account ID", where: "카카오모먼트 대시보드 상단 또는 URL에서 확인되는 광고 계정 ID (숫자)" },
    ],
  },
  tiktok_ads: {
    title: "TikTok Ads",
    env: [],
    steps: [
      "TikTok Business Center(https://ads.tiktok.com) → Assets → Business Center → API → 앱 생성",
      "또는 TikTok for Developers에서 앱 생성 후 Access Token 발급",
      "Advertiser ID: TikTok Ads Manager 대시보드 우상단 계정 정보에서 확인",
    ],
    fields: [
      { name: "Access Token", where: "TikTok for Developers → 앱 → Sandbox/Production Access Token" },
      { name: "Advertiser ID", where: "TikTok Ads Manager → 계정 정보 → Advertiser ID (18자리 숫자)" },
    ],
  },
  naver_gfa: {
    title: "네이버 성과형디스플레이광고 (GFA)",
    env: [],
    steps: [
      "네이버 광고(https://searchad.naver.com)와 다른 별도 플랫폼입니다",
      "GFA API(https://gfaapi.naver.com) 사용을 위해 네이버 GFA 고객센터에 API 사용 신청 필요",
      "발급된 API Key, Secret Key, Customer ID를 입력하세요",
    ],
    fields: [
      { name: "API Key", where: "네이버 GFA API 승인 후 발급되는 API Key" },
      { name: "Secret Key", where: "API Key와 함께 발급되는 Secret Key" },
      { name: "Customer ID", where: "GFA 계정의 고객 ID" },
    ],
  },
  shopify: {
    title: "Shopify",
    env: [],
    steps: [
      "Shopify 관리자 → 설정 → 앱 및 판매 채널 → 앱 개발 → 앱 만들기",
      "또는 Custom App 생성 → Admin API 액세스 토큰 발급",
      "Shop Domain: mystore.myshopify.com 형식으로 입력",
    ],
    fields: [
      { name: "Access Token", where: "Shopify 관리자 → 앱 → Custom App → Admin API 액세스 토큰" },
      { name: "Shop Domain", where: "Shopify 스토어 주소 (예: mystore.myshopify.com)" },
    ],
  },
  cafe24: {
    title: "카페24 (Cafe24)",
    env: [],
    steps: [
      "카페24 개발자 센터(https://developers.cafe24.com) → 앱 등록 → OAuth 앱 생성",
      "Mall ID: 카페24 쇼핑몰 ID (mystore.cafe24.com에서 mystore 부분)",
      "앱 인증 후 Refresh Token 발급 필요 (OAuth 2.0 흐름)",
    ],
    fields: [
      { name: "Mall ID", where: "카페24 쇼핑몰 주소에서 앞부분 (예: mystore)" },
      { name: "Client ID", where: "카페24 개발자센터 → 앱 정보 → Client ID" },
      { name: "Client Secret", where: "카페24 개발자센터 → 앱 정보 → Client Secret" },
      { name: "Refresh Token", where: "OAuth 2.0 인증 완료 후 발급되는 Refresh Token" },
    ],
  },
  linkedin_ads: {
    title: "LinkedIn Ads",
    env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL (OAuth 콜백용)"],
    steps: [
      "권장: 상단 [LinkedIn OAuth] 버튼 클릭 → LinkedIn 로그인 동의 → 광고 계정 자동 연결",
      "LinkedIn Campaign Manager에 활성 광고 계정이 있어야 합니다.",
      "직접 입력 시: LinkedIn Marketing API에서 Access Token, Ad Account ID를 발급해 입력",
    ],
    fields: [
      { name: "Access Token", where: "LinkedIn OAuth 버튼 사용 시 자동. 직접 입력 시 LinkedIn Marketing API에서 발급" },
      { name: "Ad Account ID", where: "LinkedIn Campaign Manager → 광고 계정 설정 → 계정 ID (숫자만)" },
    ],
  },
};

const PLATFORM_OPTIONS: { value: IntegrationPlatform; label: string }[] = [
  { value: "meta_ads",              label: "Meta 광고 (Facebook/Instagram)" },
  { value: "google_ads",            label: "Google Ads" },
  { value: "google_analytics",      label: "Google Analytics (GA4)" },
  { value: "google_search_console", label: "Google Search Console (SEO)" },
  { value: "linkedin_ads",          label: "LinkedIn Ads" },
  { value: "naver_ads",             label: "네이버 검색광고" },
  { value: "naver_gfa",             label: "네이버 성과형디스플레이광고 (GFA)" },
  { value: "kakao_moment",          label: "카카오모먼트" },
  { value: "tiktok_ads",            label: "TikTok Ads" },
  { value: "shopify",               label: "Shopify" },
  { value: "cafe24",                label: "카페24" },
];

const PLATFORM_LABEL: Record<string, string> = {
  meta_ads:              "Meta Ads",
  google_ads:            "Google Ads",
  google_analytics:      "GA4",
  google_search_console: "Search Console",
  linkedin_ads:          "LinkedIn Ads",
  naver_ads:             "네이버 검색광고",
  naver_searchad:        "네이버 검색광고",
  naver_gfa:             "네이버 GFA",
  kakao_moment:          "카카오모먼트",
  tiktok_ads:            "TikTok Ads",
  shopify:               "Shopify",
  cafe24:                "카페24",
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  active: "활성", inactive: "비활성", error: "오류",
};

const SETTING_KEYS = ["META_APP_ID", "META_APP_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_DEVELOPER_TOKEN", "NEXT_PUBLIC_APP_URL"] as const;
const SETTING_LABELS: Record<string, string> = {
  META_APP_ID: "Meta App ID",
  META_APP_SECRET: "Meta App Secret",
  GOOGLE_CLIENT_ID: "Google Client ID",
  GOOGLE_CLIENT_SECRET: "Google Client Secret",
  GOOGLE_DEVELOPER_TOKEN: "Google Developer Token (선택)",
  NEXT_PUBLIC_APP_URL: "앱 URL (OAuth 콜백용)",
};

function IntegrationTab({ clientId, initialIntegrations, router }: { clientId: string; initialIntegrations: DataIntegration[]; router: any }) {
  const searchParams = useSearchParams();
  const metaTokenFromUrl = searchParams.get("metaToken");
  const metaExpiresInFromUrl = searchParams.get("metaExpiresIn");
  const linkedInConnected = searchParams.get("linkedin") === "connected";
  const errorFromUrl = searchParams.get("error");

  const [integrations, setIntegrations] = useState<DataIntegration[]>(initialIntegrations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);

  // OAuth용 공개 키 (설정되어 있으면 프롬프트 없이 바로 OAuth)
  const [oauthKeys, setOauthKeys] = useState<{ metaAppId: string | null; googleClientId: string | null; nextPublicAppUrl: string | null } | null>(null);
  // 연동 기본 설정 (관리자 키값 관리)
  const [adminSettings, setAdminSettings] = useState<Record<string, { value: string; masked: string }>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/oauth-keys");
        if (res.ok) setOauthKeys(await res.json());
      } catch {
        // ignore
      }
    })();
  }, []);
  useEffect(() => {
    if (!settingsOpen) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setAdminSettings(data);
          setSettingsForm(
            Object.fromEntries(
              SETTING_KEYS.map((k) => [k, data[k]?.value ?? ""])
            )
          );
        }
      } catch {
        // ignore
      }
    })();
  }, [settingsOpen]);

  // Meta OAuth 콜백 후 Facebook이 붙이는 #_=_ 해시 제거 (주소창 정리)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#_=_") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Meta OAuth 콜백 후 저장 폼 (URL에 metaToken 있을 때)
  const [metaSaveDisplayName, setMetaSaveDisplayName] = useState("Meta 광고");
  const [metaSaveAdAccountId, setMetaSaveAdAccountId] = useState("");
  const [metaSaveLoading, setMetaSaveLoading] = useState(false);

  // 폼 상태
  const [platform, setPlatform] = useState<IntegrationPlatform>("meta_ads");
  const [displayName, setDisplayName] = useState("");
  // 네이버 (검색광고 + GFA 공통)
  const [naverApiKey, setNaverApiKey] = useState("");
  const [naverSecretKey, setNaverSecretKey] = useState("");
  const [naverCustomerId, setNaverCustomerId] = useState("");
  // Meta
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  // Google (Ads + GA4 + Search Console 공통 refresh token)
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState("");
  const [ga4PropertyId, setGA4PropertyId] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  // Kakao
  const [kakaoAccessToken, setKakaoAccessToken] = useState("");
  const [kakaoAdAccountId, setKakaoAdAccountId] = useState("");
  // TikTok
  const [tiktokAccessToken, setTiktokAccessToken] = useState("");
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState("");
  // Shopify
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
  // 카페24
  const [cafe24MallId, setCafe24MallId] = useState("");
  const [cafe24ClientId, setCafe24ClientId] = useState("");
  const [cafe24ClientSecret, setCafe24ClientSecret] = useState("");
  const [cafe24RefreshToken, setCafe24RefreshToken] = useState("");
  // LinkedIn
  const [linkedInAccessToken, setLinkedInAccessToken] = useState("");
  const [linkedInAdAccountId, setLinkedInAdAccountId] = useState("");
  // KPI 자동생성
  const [autoKpi, setAutoKpi] = useState(true);

  // GA4 추적 랜딩페이지 설정
  const [ga4TargetPaths, setGa4TargetPaths] = useState<string[]>([]);
  const [ga4PathInput, setGa4PathInput] = useState("");
  const [ga4PathsSaving, setGa4PathsSaving] = useState(false);
  const [ga4PathsLoaded, setGa4PathsLoaded] = useState(false);

  // GA4 추적 URL 로드 (GA4 연동이 있을 때)
  useEffect(() => {
    const hasGA4 = integrations.some((i) => i.platform === "google_analytics");
    if (!hasGA4 || ga4PathsLoaded) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/integrations/ga4-pages?clientId=${clientId}`);
        if (res.ok) {
          const json = await res.json();
          setGa4TargetPaths(json.data?.targetPaths ?? []);
          setGa4PathsLoaded(true);
        }
      } catch {
        // ignore
      }
    })();
  }, [integrations, clientId, ga4PathsLoaded]);

  const resetForm = () => {
    setPlatform("meta_ads"); setDisplayName(""); setTestResult(null); setAutoKpi(true);
    setNaverApiKey(""); setNaverSecretKey(""); setNaverCustomerId("");
    setMetaAccessToken(""); setMetaAdAccountId("");
    setGoogleRefreshToken(""); setGoogleCustomerId(""); setGoogleDeveloperToken(""); setGA4PropertyId(""); setGscSiteUrl("");
    setKakaoAccessToken(""); setKakaoAdAccountId("");
    setTiktokAccessToken(""); setTiktokAdvertiserId("");
    setShopifyAccessToken(""); setShopifyDomain("");
    setCafe24MallId(""); setCafe24ClientId(""); setCafe24ClientSecret(""); setCafe24RefreshToken("");
    setLinkedInAccessToken(""); setLinkedInAdAccountId("");
  };

  const buildCredentials = (): Record<string, string> => {
    switch (platform) {
      case "naver_ads":
      case "naver_searchad":
      case "naver_gfa":
        return { apiKey: naverApiKey, secretKey: naverSecretKey, customerId: naverCustomerId };
      case "meta_ads":
        return { accessToken: metaAccessToken, adAccountId: metaAdAccountId };
      case "google_ads":
        return { refreshToken: googleRefreshToken, customerId: googleCustomerId, developerToken: googleDeveloperToken };
      case "google_analytics":
        return { refreshToken: googleRefreshToken, propertyId: ga4PropertyId };
      case "google_search_console":
        return { refreshToken: googleRefreshToken, siteUrl: gscSiteUrl };
      case "kakao_moment":
        return { accessToken: kakaoAccessToken, adAccountId: kakaoAdAccountId };
      case "tiktok_ads":
        return { accessToken: tiktokAccessToken, advertiserId: tiktokAdvertiserId };
      case "shopify":
        return { accessToken: shopifyAccessToken, shopDomain: shopifyDomain };
      case "cafe24":
        return { mallId: cafe24MallId, clientId: cafe24ClientId, clientSecret: cafe24ClientSecret, refreshToken: cafe24RefreshToken };
      case "linkedin_ads":
        return { accessToken: linkedInAccessToken, adAccountId: linkedInAdAccountId };
      default:
        return {};
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: buildCredentials() }),
      });
      const data = await res.json();
      setTestResult(data.success ? "✅ 연결 성공!" : `❌ 연결 실패: ${data.error || "알 수 없는 오류"}`);
    } catch (err: any) {
      setTestResult(`❌ 테스트 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!displayName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          platform,
          displayName,
          credentials: buildCredentials(),
        }),
      });
      if (res.ok) {
        // KPI 자동생성
        if (autoKpi) {
          await fetch("/api/admin/kpis/auto-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, platform }),
          });
        }
        setDialogOpen(false);
        resetForm();
        router.refresh();
        const listRes = await fetch(`/api/admin/integrations?clientId=${clientId}`);
        if (listRes.ok) setIntegrations(await listRes.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 연동을 삭제하시겠습니까? 관련된 모든 지표 데이터가 삭제됩니다.")) return;
    await fetch(`/api/admin/integrations?id=${id}`, { method: "DELETE" });
    setIntegrations(prev => prev.filter(i => i.id !== id));
    router.refresh();
  };

  const handleSync = async (id: string) => {
    setSyncLoading(id);
    try {
      const res = await fetch("/api/admin/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: id }),
      });
      const data = await res.json();
      alert(data.success
        ? `동기화 완료! ${data.recordCount}건 수집됨`
        : `동기화 실패: ${data.error}`);
      router.refresh();
      const listRes = await fetch(`/api/admin/integrations?clientId=${clientId}`);
      if (listRes.ok) setIntegrations(await listRes.json());
    } finally {
      setSyncLoading(null);
    }
  };

  const handleAggregate = async () => {
    setAggregateLoading(true);
    try {
      const res = await fetch("/api/admin/sync-metrics-from-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.success !== false) {
        alert(`성과 지표 반영 완료. 추가 ${data.inserted ?? 0}건, 수정 ${data.updated ?? 0}건`);
        router.refresh();
      } else {
        alert(`반영 실패: ${data.errors?.length ? data.errors.join(", ") : "알 수 없는 오류"}`);
      }
    } catch (e: any) {
      alert(`오류: ${e?.message ?? String(e)}`);
    } finally {
      setAggregateLoading(false);
    }
  };

  const handleMetaSaveFromUrl = async () => {
    if (!metaTokenFromUrl || !metaSaveAdAccountId.trim()) {
      alert("광고 계정 ID를 입력하세요. (예: act_123456789)");
      return;
    }
    setMetaSaveLoading(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          platform: "meta_ads",
          displayName: metaSaveDisplayName.trim() || "Meta 광고",
          credentials: {
            accessToken: metaTokenFromUrl,
            adAccountId: metaSaveAdAccountId.trim().startsWith("act_") ? metaSaveAdAccountId.trim() : `act_${metaSaveAdAccountId.trim()}`,
            tokenExpiresAt: metaExpiresInFromUrl
              ? new Date(Date.now() + Number(metaExpiresInFromUrl) * 1000).toISOString()
              : undefined,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }
      router.replace(`/admin/clients/${clientId}?tab=integrations`, { scroll: false });
      router.refresh();
      const listRes = await fetch(`/api/admin/integrations?clientId=${clientId}`);
      if (listRes.ok) setIntegrations(await listRes.json());
    } catch (e: any) {
      alert(e?.message || "저장 실패");
    } finally {
      setMetaSaveLoading(false);
    }
  };

  const startMetaOAuth = () => {
    const appId = oauthKeys?.metaAppId?.trim() || prompt("Meta App ID를 입력하세요 (또는 위 연동 기본 설정에서 저장):");
    if (!appId) return;
    // 항상 현재 접속한 사이트 주소 사용 (onemarketing.kr에서 누르면 콜백도 onemarketing.kr로 감)
    const base = window.location.origin;
    const redirectUri = `${base}/api/auth/meta/callback`;
    const scope = "ads_read,ads_management";
    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${clientId}&scope=${scope}&response_type=code`;
  };

  const startGoogleOAuth = () => {
    const clientIdVal = oauthKeys?.googleClientId?.trim() || prompt("Google OAuth Client ID를 입력하세요 (또는 위 연동 기본 설정에서 저장):");
    if (!clientIdVal) return;
    const base = window.location.origin;
    const redirectUri = `${base}/api/auth/google/callback`;
    const scope = "https://www.googleapis.com/auth/adwords.readonly https://www.googleapis.com/auth/analytics.readonly";
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientIdVal}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${clientId}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;
  };

  const startLinkedInOAuth = () => {
    window.location.href = `/api/auth/linkedin?clientId=${clientId}`;
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const k of SETTING_KEYS) {
        const v = settingsForm[k]?.trim();
        if (v) payload[k] = v;
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const keysRes = await fetch("/api/admin/oauth-keys");
        if (keysRes.ok) setOauthKeys(await keysRes.json());
        setSettingsOpen(false);
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  const clearOAuthErrorFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    const qs = url.searchParams.toString();
    router.replace(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
  };

  const oauthErrorLabel = errorFromUrl
    ? (errorFromUrl === "access_denied" || errorFromUrl === "user_cancelled"
        ? "사용자가 로그인을 취소했거나 권한을 거부했습니다."
        : (() => {
            try {
              return decodeURIComponent(errorFromUrl);
            } catch {
              return errorFromUrl;
            }
          })())
    : "";

  return (
    <div className="space-y-5">
      {linkedInConnected && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">LinkedIn Ads 연동이 완료되었습니다.</p>
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("linkedin");
                const qs = url.searchParams.toString();
                router.replace(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
              }}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
      {errorFromUrl && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive font-medium">{oauthErrorLabel}</p>
            <Button variant="ghost" size="sm" onClick={clearOAuthErrorFromUrl} className="shrink-0 text-destructive hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">데이터 연동</h3>
          <p className="text-sm text-muted-foreground">외부 광고/분석 플랫폼 연결을 관리합니다</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            자동 동기화: 매일 06:00 (KST) · 수동 동기화는 각 연동 카드의 새로고침 버튼을 사용하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startMetaOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Meta OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={startGoogleOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Google OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={startLinkedInOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> LinkedIn OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5 mr-1" /> 연동 기본 설정
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 연동 추가
          </Button>
        </div>
      </div>

      {/* 연동 기본 설정 다이얼로그 — 한 번만 세팅하는 키값 관리 */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> 연동 기본 설정
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            아래 키값을 저장해 두면 OAuth 시 프롬프트 없이 사용됩니다. .env에 넣어도 되고, 여기 저장해 두면 DB에 보관됩니다 (DB 우선).
          </p>
          <div className="space-y-3 py-2">
            {SETTING_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{SETTING_LABELS[key]}</Label>
                <Input
                  type={key.includes("SECRET") || key === "GOOGLE_DEVELOPER_TOKEN" ? "password" : "text"}
                  value={settingsForm[key] ?? ""}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={adminSettings[key]?.masked ? `현재: ${adminSettings[key].masked}` : "비워두면 .env 사용"}
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={settingsSaving}>
              {settingsSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 연동 가이드: 값 넣는 위치 ── */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>연동 가이드 — 각 플랫폼 값은 어디서 넣나요?</span>
            </summary>
            <p className="mt-3 text-xs text-muted-foreground border-l-2 border-muted pl-3">
              <strong>원케이션 1세트:</strong> 아래 [연동 기본 설정]에서 키값을 저장해 두면 OAuth 시 프롬프트 없이 사용됩니다. .env에 넣어도 되고, 관리자 설정에 저장해도 됩니다.
            </p>
            <div className="mt-3 pl-6 space-y-3 text-xs text-muted-foreground border-l-2 border-muted">
              {(Object.keys(INTEGRATION_GUIDES) as (keyof typeof INTEGRATION_GUIDES)[]).map((key) => {
                const g = INTEGRATION_GUIDES[key];
                if (!g) return null;
                return (
                  <details key={key} className="group/platform">
                    <summary className="cursor-pointer font-medium text-foreground/90">{g.title}</summary>
                    <ul className="mt-1.5 space-y-1 ml-2">
                      {g.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                      {g.fields.map((f) => (
                        <li key={f.name}>
                          <strong className="text-foreground/80">{f.name}</strong>: {f.where}
                        </li>
                      ))}
                      {g.env && g.env.length > 0 && (
                        <li>필요 env: <code className="bg-muted px-1 rounded">{g.env.join(", ")}</code></li>
                      )}
                    </ul>
                  </details>
                );
              })}
            </div>
          </details>
        </CardContent>
      </Card>

      {metaTokenFromUrl && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">Meta 인증이 완료되었습니다. 광고 계정 ID를 입력하고 저장하세요.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">표시명</Label>
                <Input
                  value={metaSaveDisplayName}
                  onChange={(e) => setMetaSaveDisplayName(e.target.value)}
                  placeholder="예: Meta 광고"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">광고 계정 ID *</Label>
                <Input
                  value={metaSaveAdAccountId}
                  onChange={(e) => setMetaSaveAdAccountId(e.target.value)}
                  placeholder="act_123456789"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleMetaSaveFromUrl} disabled={metaSaveLoading}>
              {metaSaveLoading ? "저장 중..." : "연동 저장"}
            </Button>
          </CardContent>
        </Card>
      )}

      {integrations.length === 0 && !metaTokenFromUrl ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Unplug className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>연결된 플랫폼이 없습니다.</p>
          <p className="text-xs mt-1">위 버튼을 눌러 네이버, Meta, Google 등의 광고 플랫폼을 연결하세요.</p>
        </CardContent></Card>
      ) : integrations.length > 0 ? (
        <div className="grid gap-3">
          {integrations.map(integ => (
            <Card key={integ.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{integ.display_name}</span>
                    <Badge variant={integ.status === "active" ? "done" : integ.status === "error" ? "destructive" : "secondary"}>
                      {STATUS_LABEL[integ.status as IntegrationStatus] || integ.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PLATFORM_LABEL[integ.platform] || integ.platform}
                    {integ.last_synced_at && (
                      <span className="ml-2">• 마지막 동기화: {formatDateTime(integ.last_synced_at)}</span>
                    )}
                  </p>
                  {integ.error_message && (
                    <p className="text-xs text-destructive mt-1 truncate">{integ.error_message}</p>
                  )}
                  {integ.platform === "meta_ads" && (() => {
                    const creds = integ.credentials as { tokenExpiresAt?: string } | null;
                    if (!creds?.tokenExpiresAt) return null;
                    const daysLeft = Math.ceil((new Date(creds.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft > 14) return null;
                    return (
                      <p className={`text-xs mt-1 font-medium ${daysLeft <= 0 ? "text-destructive" : "text-amber-600"}`}>
                        ⚠ Meta 액세스 토큰 {daysLeft <= 0 ? "만료됨 — 재인증 필요" : `${daysLeft}일 후 만료 — 재인증 권장`}
                      </p>
                    );
                  })()}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => handleSync(integ.id)}
                    disabled={syncLoading === integ.id}
                    title="수동 동기화"
                    aria-label="수동 동기화"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncLoading === integ.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(integ.id)} title="삭제" aria-label="연동 삭제">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* GA4 추적 랜딩페이지 설정 */}
      {integrations.some((i) => i.platform === "google_analytics") && (
        <Card className="mt-4">
          <CardContent className="py-4 space-y-3">
            <div>
              <p className="font-medium text-sm">추적 랜딩페이지 설정</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                GA4 페이지별 지표 수집 시 집중 분석할 URL 경로를 지정합니다. (예: /landing/product-a)
              </p>
            </div>
            {ga4TargetPaths.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ga4TargetPaths.map((path) => (
                  <span
                    key={path}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md font-mono"
                  >
                    {path}
                    <button
                      type="button"
                      onClick={() => setGa4TargetPaths((prev) => prev.filter((p) => p !== path))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="경로 삭제"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={ga4PathInput}
                onChange={(e) => setGa4PathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && ga4PathInput.trim()) {
                    e.preventDefault();
                    const p = ga4PathInput.trim();
                    if (!ga4TargetPaths.includes(p)) setGa4TargetPaths((prev) => [...prev, p]);
                    setGa4PathInput("");
                  }
                }}
                placeholder="/landing/product-a"
                className="font-mono text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => {
                  const p = ga4PathInput.trim();
                  if (p && !ga4TargetPaths.includes(p)) setGa4TargetPaths((prev) => [...prev, p]);
                  setGa4PathInput("");
                }}
              >
                추가
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0"
                disabled={ga4PathsSaving}
                onClick={async () => {
                  setGa4PathsSaving(true);
                  try {
                    const res = await fetch("/api/admin/integrations/ga4-pages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ clientId, paths: ga4TargetPaths }),
                    });
                    if (!res.ok) {
                      const json = await res.json().catch(() => ({}));
                      toast.error(json.error || "저장 실패");
                    } else {
                      toast.success("추적 경로가 저장되었습니다.");
                    }
                  } catch {
                    toast.error("저장 요청 실패");
                  } finally {
                    setGa4PathsSaving(false);
                  }
                }}
              >
                {ga4PathsSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {integrations.length > 0 && (
        <Card className="mt-4">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">성과 지표 자동 반영</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                연동된 플랫폼의 일별 데이터를 주간·월간으로 집계해 성과 지표 탭에 반영합니다. (KPI 정의에 있는 지표만 반영)
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAggregate}
              disabled={aggregateLoading}
              title="지난 주·지난 달 구간 집계 후 metrics 반영"
            >
              <BarChart2 className={`h-4 w-4 mr-1 ${aggregateLoading ? "animate-pulse" : ""}`} />
              {aggregateLoading ? "반영 중…" : "성과 지표 반영"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 연동 추가 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>데이터 연동 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>플랫폼</Label>
              <Select value={platform} onValueChange={v => { setPlatform(v as IntegrationPlatform); setTestResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>표시 이름</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="예: 네이버 키워드 광고 - 메인 계정" />
            </div>

            {/* 플랫폼별 가이드 (값 넣는 위치) ── 다이얼로그 내 ── */}
            {INTEGRATION_GUIDES[platform] && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">값 넣는 위치</p>
                <ul className="space-y-1 text-muted-foreground">
                  {INTEGRATION_GUIDES[platform].fields.map((f) => (
                    <li key={f.name}><strong>{f.name}</strong>: {f.where}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 네이버 */}
            {(platform === "naver_ads" || platform === "naver_searchad") && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">네이버 검색광고 API 인증</p>
                <p className="text-xs text-muted-foreground">발급: 네이버 검색광고 → API 관리 → 라이선스 발급</p>
                <div className="space-y-2"><Label>API Key</Label><Input value={naverApiKey} onChange={e => setNaverApiKey(e.target.value)} placeholder="발급받은 API Key" /></div>
                <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={naverSecretKey} onChange={e => setNaverSecretKey(e.target.value)} placeholder="발급받은 Secret Key" /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={naverCustomerId} onChange={e => setNaverCustomerId(e.target.value)} placeholder="고객 ID (숫자)" /></div>
              </div>
            )}

            {/* Meta */}
            {platform === "meta_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Meta Ads 인증</p>
                <p className="text-xs text-muted-foreground">권장: 상단 [Meta OAuth] → App ID(.env의 META_APP_ID) 입력 → Facebook 인증 후 광고 계정 ID만 입력</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)} placeholder="OAuth 사용 시 자동" /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={metaAdAccountId} onChange={e => setMetaAdAccountId(e.target.value)} placeholder="act_123456789 (비즈니스 설정에서 확인)" /></div>
              </div>
            )}

            {/* Google Ads */}
            {platform === "google_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Ads 인증</p>
                <p className="text-xs text-muted-foreground">[Google OAuth] 후 URL의 googleRefreshToken 복사 → 여기 붙여넣기. Customer ID·Developer Token은 ads.google.com에서 확인</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} placeholder="OAuth 리다이렉트 URL에서 복사" /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={googleCustomerId} onChange={e => setGoogleCustomerId(e.target.value)} placeholder="123-456-7890" /></div>
                <div className="space-y-2"><Label>Developer Token (선택)</Label><Input type="password" value={googleDeveloperToken} onChange={e => setGoogleDeveloperToken(e.target.value)} placeholder=".env에 GOOGLE_DEVELOPER_TOKEN 있으면 비워도 됨" /></div>
              </div>
            )}

            {/* GA4 */}
            {platform === "google_analytics" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Analytics (GA4) 인증</p>
                <p className="text-xs text-muted-foreground">Refresh Token은 [Google OAuth]로 발급. Property ID는 GA4 관리 → 속성 → 속성 설정에서 확인 (properties/숫자)</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} placeholder="Google OAuth 후 URL에서 복사" /></div>
                <div className="space-y-2"><Label>Property ID</Label><Input value={ga4PropertyId} onChange={e => setGA4PropertyId(e.target.value)} placeholder="properties/123456789" /></div>
              </div>
            )}

            {/* Google Search Console */}
            {platform === "google_search_console" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Search Console 인증</p>
                <p className="text-xs text-muted-foreground">Refresh Token은 [Google OAuth]로 발급 (GA4·Google Ads와 동일 계정 사용 가능)</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} placeholder="Google OAuth 후 URL에서 복사" /></div>
                <div className="space-y-2"><Label>Site URL</Label><Input value={gscSiteUrl} onChange={e => setGscSiteUrl(e.target.value)} placeholder="https://example.com/ 또는 sc-domain:example.com" /></div>
              </div>
            )}

            {/* 네이버 GFA */}
            {platform === "naver_gfa" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">네이버 GFA (성과형디스플레이광고) 인증</p>
                <div className="space-y-2"><Label>API Key</Label><Input value={naverApiKey} onChange={e => setNaverApiKey(e.target.value)} placeholder="GFA API Key" /></div>
                <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={naverSecretKey} onChange={e => setNaverSecretKey(e.target.value)} placeholder="GFA Secret Key" /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={naverCustomerId} onChange={e => setNaverCustomerId(e.target.value)} placeholder="고객 ID (숫자)" /></div>
              </div>
            )}

            {/* 카카오모먼트 */}
            {platform === "kakao_moment" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">카카오모먼트 인증</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={kakaoAccessToken} onChange={e => setKakaoAccessToken(e.target.value)} placeholder="카카오 비즈니스 → API 설정 → 액세스 토큰" /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={kakaoAdAccountId} onChange={e => setKakaoAdAccountId(e.target.value)} placeholder="광고 계정 ID (숫자)" /></div>
              </div>
            )}

            {/* TikTok Ads */}
            {platform === "tiktok_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">TikTok Ads 인증</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={tiktokAccessToken} onChange={e => setTiktokAccessToken(e.target.value)} placeholder="TikTok for Developers → Access Token" /></div>
                <div className="space-y-2"><Label>Advertiser ID</Label><Input value={tiktokAdvertiserId} onChange={e => setTiktokAdvertiserId(e.target.value)} placeholder="18자리 숫자 (Ads Manager → 계정 정보)" /></div>
              </div>
            )}

            {/* Shopify */}
            {platform === "shopify" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Shopify 인증</p>
                <div className="space-y-2"><Label>Shop Domain</Label><Input value={shopifyDomain} onChange={e => setShopifyDomain(e.target.value)} placeholder="mystore.myshopify.com" /></div>
                <div className="space-y-2"><Label>Admin API Access Token</Label><Input type="password" value={shopifyAccessToken} onChange={e => setShopifyAccessToken(e.target.value)} placeholder="shpat_xxxx (앱 → Admin API 액세스 토큰)" /></div>
              </div>
            )}

            {/* 카페24 */}
            {platform === "cafe24" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">카페24 인증</p>
                <div className="space-y-2"><Label>Mall ID</Label><Input value={cafe24MallId} onChange={e => setCafe24MallId(e.target.value)} placeholder="mystore (쇼핑몰 주소 앞부분)" /></div>
                <div className="space-y-2"><Label>Client ID</Label><Input value={cafe24ClientId} onChange={e => setCafe24ClientId(e.target.value)} placeholder="카페24 개발자센터 → Client ID" /></div>
                <div className="space-y-2"><Label>Client Secret</Label><Input type="password" value={cafe24ClientSecret} onChange={e => setCafe24ClientSecret(e.target.value)} placeholder="카페24 개발자센터 → Client Secret" /></div>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={cafe24RefreshToken} onChange={e => setCafe24RefreshToken(e.target.value)} placeholder="OAuth 인증 후 발급된 Refresh Token" /></div>
              </div>
            )}

            {/* LinkedIn Ads */}
            {platform === "linkedin_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">LinkedIn Ads 인증</p>
                <p className="text-xs text-muted-foreground">권장: 상단 [LinkedIn OAuth] 버튼 클릭 → LinkedIn 로그인 동의 → 광고 계정 자동 연결</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={linkedInAccessToken} onChange={e => setLinkedInAccessToken(e.target.value)} placeholder="LinkedIn OAuth 사용 시 자동" /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={linkedInAdAccountId} onChange={e => setLinkedInAdAccountId(e.target.value)} placeholder="Campaign Manager → 광고 계정 ID (숫자)" /></div>
              </div>
            )}

            {/* KPI 자동 생성 옵션 */}
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <input
                type="checkbox"
                id="autoKpi"
                checked={autoKpi}
                onChange={e => setAutoKpi(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="autoKpi" className="text-sm cursor-pointer">
                <span className="font-medium">KPI 자동 생성</span>
                <span className="text-muted-foreground ml-1.5 text-xs">— 이 플랫폼의 기본 KPI 세트를 자동으로 추가합니다</span>
              </label>
            </div>

            {testResult && <p className="text-sm">{testResult}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={loading}>
              <TestTube2 className="h-3.5 w-3.5 mr-1" /> {loading ? "테스트 중..." : "연결 테스트"}
            </Button>
            <Button onClick={handleAdd} disabled={loading || !displayName}>
              <Zap className="h-3.5 w-3.5 mr-1" /> {loading ? "저장 중..." : "연동 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── 활성 모듈용 아이콘 매핑 ──
const moduleIcons: Record<keyof EnabledModules, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  execution: Zap,
  calendar: CalendarDays,
  projects: FolderKanban,
  reports: FileText,
  assets: Image,
  support: MessageCircle,
  timeline: History,
};

// ╔══════════════════════════════════════════════╗
// ║  활성 모듈 탭 (이용중인 서비스 스타일)           ║
// ╚══════════════════════════════════════════════╝
function ModuleTab({ clientId, initialModules, supabase, router }: { clientId: string; initialModules: EnabledModules; supabase: any; router: any }) {
  const [modules, setModules] = useState<EnabledModules>(initialModules);
  const [loading, setLoading] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState("");
  const toggle = (key: keyof EnabledModules) => { setModules(prev => ({ ...prev, [key]: !prev[key] })); setSaved(false); setError(""); };
  const handleSave = async () => { setLoading(true); setError(""); try { const { error: e } = await supabase.from("clients").update({ enabled_modules: modules }).eq("id", clientId); if (e) setError(e.message); else { setSaved(true); router.refresh(); } } finally { setLoading(false); } };
  return (<div className="space-y-4">
    <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">활성 모듈</h3><Button size="sm" onClick={handleSave} disabled={loading}><Save className="h-4 w-4 mr-1" /> {loading ? "저장 중..." : "저장"}</Button></div>
    {saved && <p className="text-sm text-green-600">저장되었습니다.</p>}
    {error && <p className="text-sm text-destructive">{error}</p>}
    <p className="text-sm text-muted-foreground">클라이언트 포털에서 보일 메뉴를 선택하세요.</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {(Object.keys(moduleLabels) as (keyof EnabledModules)[]).map(key => {
        const Icon = moduleIcons[key];
        const isOn = modules[key];
        return (
          <button key={key} type="button" onClick={() => toggle(key)} className={cn("flex items-center gap-3 p-4 rounded-xl border text-left transition-all", isOn ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/50 bg-muted/20 hover:bg-muted/40")}>
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", isOn ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}><Icon className="h-5 w-5" /></div>
            <span className="text-sm font-medium">{moduleLabels[key]}</span>
            <span className="ml-auto shrink-0">{isOn ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />}</span>
          </button>
        );
      })}
    </div>
  </div>);
}

// ╔══════════════════════════════════════════════╗
// ║  클라이언트 팀원 탭                             ║
// ╚══════════════════════════════════════════════╝
const CLIENT_ROLE_LABELS: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner:   { label: "오너",   icon: Crown,      color: "text-amber-500" },
  manager: { label: "매니저", icon: ShieldCheck, color: "text-blue-500" },
  viewer:  { label: "뷰어",   icon: Eye,         color: "text-slate-500" },
};

interface ClientMember {
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
}

interface ClientPendingInvite {
  id: string;
  invited_email: string;
  created_at: string;
  expires_at: string;
}

function ClientTeamTab({ clientId }: { clientId: string }) {
  const [members, setMembers] = useState<ClientMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ClientPendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendAlimtalk, setSendAlimtalk] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/members`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
        setPendingInvites(data.pendingInvites ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("이메일을 입력해 주세요."); return; }
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitedEmail: inviteEmail.trim(), sendAlimtalk }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "초대 실패"); return; }
      setInviteUrl(data.inviteUrl);
      await fetchMembers();
      toast.success("초대 링크가 생성되었습니다.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`${name}님의 포털 접근 권한을 제거할까요?`)) return;
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "제거 실패"); return; }
      toast.success("멤버가 제거되었습니다.");
      await fetchMembers();
    } catch { toast.error("서버 오류가 발생했습니다."); }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteUrl("");
    setCopied(false);
    setSendAlimtalk(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">포털 접속 멤버</h3>
          <p className="text-sm text-muted-foreground mt-0.5">이 클라이언트의 포털에 접속할 수 있는 담당자들입니다.</p>
        </div>
        <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          담당자 초대
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {members.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">{member.display_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(member.created_at), "yyyy.MM.dd", { locale: ko })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveMember(member.user_id, member.display_name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pendingInvites.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">초대 대기 중</p>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{invite.invited_email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(invite.expires_at), "M/d까지", { locale: ko })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && pendingInvites.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg bg-muted/20">
              아직 포털 접속 담당자가 없습니다. 담당자를 초대해 보세요.
            </div>
          )}
        </div>
      )}

      {/* 초대 다이얼로그 */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>포털 담당자 초대</DialogTitle>
          </DialogHeader>
          {!inviteUrl ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="clientInviteEmail">이메일</Label>
                <Input
                  id="clientInviteEmail"
                  type="email"
                  placeholder="contact@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteLoading}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={sendAlimtalk}
                  onChange={(e) => setSendAlimtalk(e.target.checked)}
                  className="rounded"
                />
                알림톡으로 초대 링크 발송 (클라이언트 담당자 전화번호 필요)
              </label>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">아래 초대 링크를 복사해 담당자에게 전달하세요. 7일간 유효합니다.</p>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" onClick={copyUrl}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            {!inviteUrl ? (
              <>
                <Button variant="outline" onClick={closeDialog}>취소</Button>
                <Button onClick={handleInvite} disabled={inviteLoading}>
                  {inviteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />처리 중...</> : "초대 링크 생성"}
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={closeDialog}>닫기</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── AdBudgetTab ───────────────────────────────────────────────────────────

const KNOWN_PLATFORMS = [
  { key: "naver_ads", label: "네이버 광고" },
  { key: "meta_ads", label: "메타 광고" },
  { key: "google_ads", label: "구글 광고" },
  { key: "kakao_ads", label: "카카오 광고" },
  { key: "coupang_ads", label: "쿠팡 광고" },
  { key: "tiktok_ads", label: "틱톡 광고" },
  { key: "other", label: "기타" },
];

function AdBudgetTab({
  clientId,
  initialBudget,
  supabase: _supabase,
  router: _router,
}: {
  clientId: string;
  initialBudget: Record<string, number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router?: any;
}) {
  const [budget, setBudget] = useState<Record<string, number>>(initialBudget ?? {});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [platformKey, setPlatformKey] = useState("naver_ads");
  const [customKey, setCustomKey] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = _supabase ?? createClient();

  const totalBudget = Object.values(budget).reduce((s, v) => s + v, 0);

  function openAdd() {
    setEditKey(null);
    setPlatformKey("naver_ads");
    setCustomKey("");
    setAmount("");
    setDialogOpen(true);
  }

  function openEdit(key: string) {
    setEditKey(key);
    const known = KNOWN_PLATFORMS.find((p) => p.key === key);
    if (known) {
      setPlatformKey(key);
      setCustomKey("");
    } else {
      setPlatformKey("other");
      setCustomKey(key);
    }
    setAmount(String(budget[key] ?? ""));
    setDialogOpen(true);
  }

  async function handleSave() {
    const finalKey = platformKey === "other" ? customKey.trim() : platformKey;
    if (!finalKey) return;
    const numAmount = parseInt(amount.replace(/,/g, ""), 10);
    if (isNaN(numAmount) || numAmount < 0) return;

    setSaving(true);
    const newBudget = { ...budget };
    if (editKey && editKey !== finalKey) delete newBudget[editKey];
    newBudget[finalKey] = numAmount;

    const { error } = await supabase
      .from("clients")
      .update({ monthly_ad_budget: newBudget })
      .eq("id", clientId);

    setSaving(false);
    if (!error) {
      setBudget(newBudget);
      setDialogOpen(false);
    }
  }

  async function handleDelete(key: string) {
    const newBudget = { ...budget };
    delete newBudget[key];
    await supabase.from("clients").update({ monthly_ad_budget: newBudget }).eq("id", clientId);
    setBudget(newBudget);
  }

  const getPlatformLabel = (key: string) =>
    KNOWN_PLATFORMS.find((p) => p.key === key)?.label ?? key;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">월 총 광고 예산</p>
          <p className="text-2xl font-bold">
            {totalBudget > 0 ? `₩${totalBudget.toLocaleString()}` : "—"}
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          플랫폼 추가
        </Button>
      </div>

      {Object.keys(budget).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          등록된 광고 예산이 없습니다. 플랫폼을 추가해 주세요.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">플랫폼</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">월 예산</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">비중</th>
                <th className="px-4 py-2 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(budget)
                .sort(([, a], [, b]) => b - a)
                .map(([key, val]) => (
                  <tr key={key} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{getPlatformLabel(key)}</td>
                    <td className="px-4 py-2 text-right">₩{val.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {totalBudget > 0 ? `${Math.round((val / totalBudget) * 100)}%` : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(key)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(key)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editKey ? "예산 수정" : "플랫폼 예산 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>플랫폼</Label>
              <Select value={platformKey} onValueChange={setPlatformKey} disabled={!!editKey && KNOWN_PLATFORMS.some(p => p.key === editKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_PLATFORMS.map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {platformKey === "other" && (
              <div className="space-y-1.5">
                <Label>플랫폼 키 (영문)</Label>
                <Input
                  placeholder="예: twitter_ads"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>월 예산 (원)</Label>
              <Input
                placeholder="예: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</> : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

