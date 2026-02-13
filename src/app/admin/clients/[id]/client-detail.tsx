"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Client, EnabledModules, KpiDefinition, ActionStatus, PeriodType,
  EventStatus, ProjectType, ProjectStage, ReportType, AssetType,
  DataIntegration, IntegrationPlatform, IntegrationStatus,
} from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  GripVertical,
} from "lucide-react";
import { SERVICE_CATALOG, ALL_SERVICE_KEYS, defaultEnabledServices } from "@/lib/service-catalog";
import { ServiceIcon } from "@/components/service-icon";

// ── 모듈 라벨 ──
const moduleLabels: Record<keyof EnabledModules, string> = {
  overview: "개요", execution: "실행 현황", calendar: "캘린더",
  projects: "프로젝트", reports: "리포트", assets: "자료실", support: "문의하기",
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
  initialKpis: KpiDefinition[];
  initialMetrics: any[];
  initialActions: any[];
  initialEvents: any[];
  initialProjects: any[];
  initialReports: any[];
  initialAssets: any[];
  initialIntegrations: DataIntegration[];
}

export function ClientDetail({
  client, clientProfile,
  initialKpis, initialMetrics, initialActions,
  initialEvents, initialProjects, initialReports, initialAssets,
  initialIntegrations,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

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

      {/* ── 탭 ── */}
      <Tabs defaultValue="kpis" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <TabsList className="flex-wrap h-auto gap-1 w-max md:w-auto">
          <TabsTrigger value="kpis">KPI 정의</TabsTrigger>
          <TabsTrigger value="metrics">성과 지표</TabsTrigger>
          <TabsTrigger value="actions">실행 항목</TabsTrigger>
          <TabsTrigger value="calendar">캘린더</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="reports">리포트</TabsTrigger>
          <TabsTrigger value="assets">자료실</TabsTrigger>
          <TabsTrigger value="integrations">데이터 연동</TabsTrigger>
          <TabsTrigger value="services">이용중인 서비스</TabsTrigger>
          <TabsTrigger value="modules">활성 모듈</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="kpis"><KpiTab clientId={client.id} initialKpis={initialKpis} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="metrics"><MetricTab clientId={client.id} initialMetrics={initialMetrics} kpiDefs={initialKpis} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="actions"><ActionTab clientId={client.id} initialActions={initialActions} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="calendar"><CalendarTab clientId={client.id} initialEvents={initialEvents} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="projects"><ProjectTab clientId={client.id} initialProjects={initialProjects} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="reports"><ReportTab clientId={client.id} initialReports={initialReports} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="assets"><AssetTab clientId={client.id} initialAssets={initialAssets} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="integrations"><IntegrationTab clientId={client.id} initialIntegrations={initialIntegrations} router={router} /></TabsContent>
        <TabsContent value="services"><ServiceTab clientId={client.id} initialServices={(client.enabled_services || {}) as Record<string, boolean>} initialServiceUrls={(client.service_urls || {}) as Record<string, string>} supabase={supabase} router={router} /></TabsContent>
        <TabsContent value="modules"><ModuleTab clientId={client.id} initialModules={client.enabled_modules as EnabledModules} supabase={supabase} router={router} /></TabsContent>
      </Tabs>

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
// ║  캘린더 탭                                     ║
// ╚══════════════════════════════════════════════╝
function CalendarTab({ clientId, initialEvents, supabase, router }: { clientId: string; initialEvents: any[]; supabase: any; router: any }) {
  const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [startAt, setStartAt] = useState(""); const [endAt, setEndAt] = useState(""); const [eventType, setEventType] = useState("task"); const [status, setStatus] = useState<EventStatus>("planned");
  const openCreate = () => { setEditing(null); setTitle(""); setDescription(""); setStartAt(""); setEndAt(""); setEventType("task"); setStatus("planned"); setDialogOpen(true); };
  const openEdit = (ev: any) => { setEditing(ev); setTitle(ev.title); setDescription(ev.description || ""); setStartAt(ev.start_at?.slice(0, 16) || ""); setEndAt(ev.end_at?.slice(0, 16) || ""); setEventType(ev.event_type); setStatus(ev.status); setDialogOpen(true); };
  const handleSave = async () => { setLoading(true); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const payload = { title, description: description || null, start_at: new Date(startAt).toISOString(), end_at: endAt ? new Date(endAt).toISOString() : null, event_type: eventType, status, related_action_ids: [] };
    if (editing) { await supabase.from("calendar_events").update(payload).eq("id", editing.id); }
    else { await supabase.from("calendar_events").insert({ ...payload, client_id: clientId, visibility: "visible", created_by: user.id }); }
    setDialogOpen(false); router.refresh(); setLoading(false); };
  return (<>
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">캘린더</h3><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 추가</Button></div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>제목</TableHead><TableHead>시작</TableHead><TableHead>종료</TableHead><TableHead>상태</TableHead><TableHead className="text-right">수정</TableHead></TableRow></TableHeader><TableBody>
      {initialEvents.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow> : initialEvents.map((ev: any) => (
        <TableRow key={ev.id}><TableCell className="font-medium">{ev.title}</TableCell><TableCell className="text-sm">{formatDateTime(ev.start_at)}</TableCell><TableCell className="text-sm">{ev.end_at ? formatDateTime(ev.end_at) : "-"}</TableCell><TableCell><StatusBadge status={ev.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(ev)} aria-label="일정 수정"><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "수정" : "추가"}</DialogTitle></DialogHeader><div className="space-y-4">
      <div className="space-y-2"><Label>제목</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="space-y-2"><Label>설명</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>시작</Label><Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} /></div><div className="space-y-2"><Label>종료</Label><Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>일정 타입</Label><Select value={eventType} onValueChange={setEventType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="task">작업</SelectItem><SelectItem value="meeting">미팅</SelectItem><SelectItem value="deadline">마감일</SelectItem><SelectItem value="milestone">마일스톤</SelectItem><SelectItem value="other">기타</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>상태</Label><Select value={status} onValueChange={v => setStatus(v as EventStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">계획됨</SelectItem><SelectItem value="done">완료</SelectItem><SelectItem value="hold">보류</SelectItem></SelectContent></Select></div></div>
    </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button><Button onClick={handleSave} disabled={loading || !title || !startAt}>{loading ? "저장 중..." : "저장"}</Button></DialogFooter></DialogContent></Dialog>
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
function AssetTab({ clientId, initialAssets, supabase, router }: { clientId: string; initialAssets: any[]; supabase: any; router: any }) {
  const [dialogOpen, setDialogOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [title, setTitle] = useState(""); const [assetType, setAssetType] = useState<AssetType>("other"); const [tagList, setTagList] = useState<string[]>([]); const [tagInput, setTagInput] = useState(""); const [file, setFile] = useState<File | null>(null);
  const openCreate = () => { setTitle(""); setAssetType("other"); setTagList([]); setTagInput(""); setFile(null); setError(""); setDialogOpen(true); };
  const addTag = () => { const v = tagInput.trim(); if (v && !tagList.includes(v)) { setTagList(prev => [...prev, v]); setTagInput(""); } };
  const removeTag = (idx: number) => { setTagList(prev => prev.filter((_, i) => i !== idx)); };
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } };
  const handleSave = async () => { if (!title || !file) { setError("제목과 파일은 필수입니다."); return; }
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const filePath = safeFilePath(clientId, file.name);
    const { error: upErr } = await supabase.storage.from("assets").upload(filePath, file);
    if (upErr) { setError("업로드 실패: " + upErr.message); setLoading(false); return; }
    const tagsToSave = tagInput.trim() ? [...tagList, tagInput.trim()] : tagList;
    await supabase.from("assets").insert({ client_id: clientId, asset_type: assetType, title, file_path: filePath, tags: tagsToSave, visibility: "visible", created_by: user.id });
    setDialogOpen(false); router.refresh(); setLoading(false); };
  return (<>
    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">자료실</h3><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> 추가</Button></div>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>제목</TableHead><TableHead>유형</TableHead><TableHead>태그</TableHead><TableHead>파일</TableHead></TableRow></TableHeader><TableBody>
      {initialAssets.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">없음</TableCell></TableRow> : initialAssets.map((a: any) => (
        <TableRow key={a.id}><TableCell className="font-medium">{a.title}</TableCell><TableCell><Badge variant="outline">{a.asset_type}</Badge></TableCell><TableCell className="text-xs">{a.tags?.join(", ") || "-"}</TableCell><TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{a.file_path}</TableCell></TableRow>
      ))}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>에셋 추가</DialogTitle></DialogHeader><div className="space-y-4">
      <div className="space-y-2"><Label>제목 *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
      <div className="space-y-2"><Label>유형</Label><Select value={assetType} onValueChange={v => setAssetType(v as AssetType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="logo">로고</SelectItem><SelectItem value="guideline">가이드라인</SelectItem><SelectItem value="font">폰트</SelectItem><SelectItem value="photo">사진</SelectItem><SelectItem value="video">영상</SelectItem><SelectItem value="other">기타</SelectItem></SelectContent></Select></div>
      <div className="space-y-2">
        <Label>태그 (입력 후 엔터로 추가)</Label>
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
          {tagList.map((t, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {t}
              <button type="button" onClick={() => removeTag(i)} className="rounded-full hover:bg-muted p-0.5" aria-label="태그 제거"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tagList.length === 0 ? "태그 입력 후 엔터" : ""}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          />
        </div>
      </div>
      <div className="space-y-2"><Label>파일 *</Label><Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button><Button onClick={handleSave} disabled={loading}><Upload className="h-4 w-4 mr-1" />{loading ? "업로드 중..." : "업로드"}</Button></DialogFooter></DialogContent></Dialog>
  </>);
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
const PLATFORM_OPTIONS: { value: IntegrationPlatform; label: string }[] = [
  { value: "naver_ads", label: "네이버 검색광고" },
  { value: "meta_ads", label: "Meta 광고 (Facebook/Instagram)" },
  { value: "google_ads", label: "Google Ads" },
  { value: "google_analytics", label: "Google Analytics (GA4)" },
];

const PLATFORM_LABEL: Record<string, string> = {
  naver_ads: "네이버 검색광고",
  naver_searchad: "네이버 검색광고",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  google_analytics: "GA4",
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  active: "활성", inactive: "비활성", error: "오류",
};

function IntegrationTab({ clientId, initialIntegrations, router }: { clientId: string; initialIntegrations: DataIntegration[]; router: any }) {
  const [integrations, setIntegrations] = useState<DataIntegration[]>(initialIntegrations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);

  // 폼 상태
  const [platform, setPlatform] = useState<IntegrationPlatform>("naver_ads");
  const [displayName, setDisplayName] = useState("");
  // 네이버
  const [naverApiKey, setNaverApiKey] = useState("");
  const [naverSecretKey, setNaverSecretKey] = useState("");
  const [naverCustomerId, setNaverCustomerId] = useState("");
  // Meta
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  // Google
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState("");
  const [ga4PropertyId, setGA4PropertyId] = useState("");

  const resetForm = () => {
    setPlatform("naver_ads"); setDisplayName(""); setTestResult(null);
    setNaverApiKey(""); setNaverSecretKey(""); setNaverCustomerId("");
    setMetaAccessToken(""); setMetaAdAccountId("");
    setGoogleRefreshToken(""); setGoogleCustomerId(""); setGoogleDeveloperToken(""); setGA4PropertyId("");
  };

  const buildCredentials = (): Record<string, string> => {
    switch (platform) {
      case "naver_ads":
      case "naver_searchad":
        return { apiKey: naverApiKey, secretKey: naverSecretKey, customerId: naverCustomerId };
      case "meta_ads":
        return { accessToken: metaAccessToken, adAccountId: metaAdAccountId };
      case "google_ads":
        return { refreshToken: googleRefreshToken, customerId: googleCustomerId, developerToken: googleDeveloperToken };
      case "google_analytics":
        return { refreshToken: googleRefreshToken, propertyId: ga4PropertyId };
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
        setDialogOpen(false);
        resetForm();
        router.refresh();
        // 목록 새로고침
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

  const startMetaOAuth = () => {
    const appId = prompt("Meta App ID를 입력하세요:");
    if (!appId) return;
    const redirectUri = `${window.location.origin}/api/auth/meta/callback`;
    const scope = "ads_read,ads_management";
    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${clientId}&scope=${scope}&response_type=code`;
  };

  const startGoogleOAuth = () => {
    const clientIdVal = prompt("Google OAuth Client ID를 입력하세요:");
    if (!clientIdVal) return;
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = "https://www.googleapis.com/auth/adwords.readonly https://www.googleapis.com/auth/analytics.readonly";
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientIdVal}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${clientId}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">데이터 연동</h3>
          <p className="text-sm text-muted-foreground">외부 광고/분석 플랫폼 연결을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startMetaOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Meta OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={startGoogleOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Google OAuth
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 연동 추가
          </Button>
        </div>
      </div>

      {integrations.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Unplug className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>연결된 플랫폼이 없습니다.</p>
          <p className="text-xs mt-1">위 버튼을 눌러 네이버, Meta, Google 등의 광고 플랫폼을 연결하세요.</p>
        </CardContent></Card>
      ) : (
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

            {/* 네이버 */}
            {(platform === "naver_ads" || platform === "naver_searchad") && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">네이버 검색광고 API 인증</p>
                <div className="space-y-2"><Label>API Key</Label><Input value={naverApiKey} onChange={e => setNaverApiKey(e.target.value)} /></div>
                <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={naverSecretKey} onChange={e => setNaverSecretKey(e.target.value)} /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={naverCustomerId} onChange={e => setNaverCustomerId(e.target.value)} /></div>
              </div>
            )}

            {/* Meta */}
            {platform === "meta_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Meta Ads 인증</p>
                <p className="text-xs text-muted-foreground">위의 "Meta OAuth" 버튼으로 인증하거나, 직접 토큰을 입력하세요.</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)} /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={metaAdAccountId} onChange={e => setMetaAdAccountId(e.target.value)} placeholder="act_123456789" /></div>
              </div>
            )}

            {/* Google Ads */}
            {platform === "google_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Ads 인증</p>
                <p className="text-xs text-muted-foreground">위의 "Google OAuth" 버튼으로 인증하거나, 직접 토큰을 입력하세요.</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={googleCustomerId} onChange={e => setGoogleCustomerId(e.target.value)} placeholder="123-456-7890" /></div>
                <div className="space-y-2"><Label>Developer Token</Label><Input type="password" value={googleDeveloperToken} onChange={e => setGoogleDeveloperToken(e.target.value)} /></div>
              </div>
            )}

            {/* GA4 */}
            {platform === "google_analytics" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Analytics (GA4) 인증</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} /></div>
                <div className="space-y-2"><Label>Property ID</Label><Input value={ga4PropertyId} onChange={e => setGA4PropertyId(e.target.value)} placeholder="properties/123456789" /></div>
              </div>
            )}

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
