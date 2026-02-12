"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KpiDefinition, ValidationRule } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";

interface Props {
  initialKpis: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function KpisAdmin({ initialKpis, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [metricKey, setMetricKey] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [showOnOverview, setShowOnOverview] = useState(true);
  const [overviewOrder, setOverviewOrder] = useState(0);
  const [chartEnabled, setChartEnabled] = useState(false);
  const [description, setDescription] = useState("");
  const [validationRequired, setValidationRequired] = useState(true);
  const [validationInteger, setValidationInteger] = useState(false);
  const [validationMin, setValidationMin] = useState("");
  const [validationMax, setValidationMax] = useState("");

  const openCreate = () => {
    setEditing(null);
    setClientId(clients[0]?.id || "");
    setMetricKey("");
    setMetricLabel("");
    setUnit("");
    setShowOnOverview(true);
    setOverviewOrder(0);
    setChartEnabled(false);
    setDescription("");
    setValidationRequired(true);
    setValidationInteger(false);
    setValidationMin("");
    setValidationMax("");
    setDialogOpen(true);
  };

  const openEdit = (kpi: any) => {
    setEditing(kpi);
    setClientId(kpi.client_id);
    setMetricKey(kpi.metric_key);
    setMetricLabel(kpi.metric_label);
    setUnit(kpi.unit);
    setShowOnOverview(kpi.show_on_overview);
    setOverviewOrder(kpi.overview_order);
    setChartEnabled(kpi.chart_enabled);
    setDescription(kpi.description || "");
    const vr = kpi.validation_rule as ValidationRule;
    setValidationRequired(vr?.required ?? true);
    setValidationInteger(vr?.integer ?? false);
    setValidationMin(vr?.min?.toString() || "");
    setValidationMax(vr?.max?.toString() || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const validationRule: ValidationRule = {
        required: validationRequired,
        integer: validationInteger,
        ...(validationMin !== "" && { min: Number(validationMin) }),
        ...(validationMax !== "" && { max: Number(validationMax) }),
      };

      if (editing) {
        await supabase.from("kpi_definitions").update({
          metric_label: metricLabel,
          unit,
          show_on_overview: showOnOverview,
          overview_order: overviewOrder,
          chart_enabled: chartEnabled,
          description: description || null,
          validation_rule: validationRule,
        }).eq("id", editing.id);
      } else {
        await supabase.from("kpi_definitions").insert({
          client_id: clientId,
          metric_key: metricKey,
          metric_label: metricLabel,
          unit,
          show_on_overview: showOnOverview,
          overview_order: overviewOrder,
          chart_enabled: chartEnabled,
          description: description || null,
          validation_rule: validationRule,
        });
      }
      setDialogOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> KPI 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>클라이언트</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Overview</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialKpis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    등록된 KPI가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                initialKpis.map((kpi: any) => (
                  <TableRow key={kpi.id}>
                    <TableCell className="text-sm">{kpi.clients?.name || "-"}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1 rounded">{kpi.metric_key}</code></TableCell>
                    <TableCell className="font-medium">{kpi.metric_label}</TableCell>
                    <TableCell>{kpi.unit}</TableCell>
                    <TableCell>
                      <Badge variant={kpi.show_on_overview ? "done" : "secondary"}>
                        {kpi.show_on_overview ? "표시" : "숨김"}
                      </Badge>
                    </TableCell>
                    <TableCell>{kpi.overview_order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(kpi)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {!editing && (
              <div className="space-y-2">
                <Label>클라이언트</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metric Key</Label>
                <Input value={metricKey} onChange={(e) => setMetricKey(e.target.value)} placeholder="visitors" disabled={!!editing} />
              </div>
              <div className="space-y-2">
                <Label>Label (표시명)</Label>
                <Input value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} placeholder="방문자 수" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>단위</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="명" />
              </div>
              <div className="space-y-2">
                <Label>Overview 순서</Label>
                <Input type="number" value={overviewOrder} onChange={(e) => setOverviewOrder(Number(e.target.value))} />
              </div>
              <div className="space-y-2 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={showOnOverview} onChange={() => setShowOnOverview(!showOnOverview)} />
                  Overview 표시
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={chartEnabled} onChange={() => setChartEnabled(!chartEnabled)} />
                  차트 활성화
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Validation Rules</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={validationRequired} onChange={() => setValidationRequired(!validationRequired)} />
                  필수값
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={validationInteger} onChange={() => setValidationInteger(!validationInteger)} />
                  정수만
                </label>
                <div className="space-y-1">
                  <Label className="text-xs">최소값</Label>
                  <Input type="number" value={validationMin} onChange={(e) => setValidationMin(e.target.value)} placeholder="없음" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">최대값</Label>
                  <Input type="number" value={validationMax} onChange={(e) => setValidationMax(e.target.value)} placeholder="없음" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading || !metricKey || !metricLabel}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
