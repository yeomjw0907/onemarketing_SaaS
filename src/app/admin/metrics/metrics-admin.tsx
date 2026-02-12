"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KpiDefinition, ValidationRule, PeriodType } from "@/lib/types/database";
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
import { formatDate } from "@/lib/utils";
import { Plus, Pencil } from "lucide-react";

interface Props {
  initialMetrics: any[];
  clients: { id: string; name: string; client_code: string }[];
}

export function MetricsAdmin({ initialMetrics, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [kpiDefs, setKpiDefs] = useState<KpiDefinition[]>([]);
  const [validationError, setValidationError] = useState("");

  const [clientId, setClientId] = useState("");
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [metricKey, setMetricKey] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (clientId) {
      supabase
        .from("kpi_definitions")
        .select("*")
        .eq("client_id", clientId)
        .then(({ data }) => setKpiDefs(data || []));
    }
  }, [clientId, supabase]);

  const openCreate = () => {
    setEditing(null);
    setClientId(clients[0]?.id || "");
    setPeriodType("weekly");
    setPeriodStart("");
    setPeriodEnd("");
    setMetricKey("");
    setValue("");
    setNotes("");
    setValidationError("");
    setDialogOpen(true);
  };

  const validateValue = (val: string, key: string): string | null => {
    const def = kpiDefs.find((k) => k.metric_key === key);
    if (!def?.validation_rule) return null;
    const vr = def.validation_rule as ValidationRule;
    const numVal = Number(val);

    if (vr.required && (val === "" || isNaN(numVal))) return "값은 필수입니다.";
    if (vr.integer && !Number.isInteger(numVal)) return "정수만 입력 가능합니다.";
    if (vr.min !== undefined && numVal < vr.min) return `최소값: ${vr.min}`;
    if (vr.max !== undefined && numVal > vr.max) return `최대값: ${vr.max}`;
    return null;
  };

  const handleSave = async () => {
    const err = validateValue(value, metricKey);
    if (err) {
      setValidationError(err);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editing) {
        await supabase.from("metrics").update({
          value: Number(value),
          notes: notes || null,
        }).eq("id", editing.id);
      } else {
        await supabase.from("metrics").insert({
          client_id: clientId,
          period_type: periodType,
          period_start: periodStart,
          period_end: periodEnd,
          metric_key: metricKey,
          value: Number(value),
          notes: notes || null,
          visibility: "visible",
          created_by: user.id,
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
          <Plus className="h-4 w-4 mr-2" /> Metric 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>클라이언트</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>Metric Key</TableHead>
                <TableHead>값</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMetrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    등록된 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                initialMetrics.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.clients?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{m.period_type}</Badge>
                      <span className="text-xs ml-1">{formatDate(m.period_start)}</span>
                    </TableCell>
                    <TableCell><code className="text-xs">{m.metric_key}</code></TableCell>
                    <TableCell className="font-medium">{Number(m.value).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{m.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditing(m);
                        setClientId(m.client_id);
                        setMetricKey(m.metric_key);
                        setValue(m.value.toString());
                        setNotes(m.notes || "");
                        setValidationError("");
                        setDialogOpen(true);
                      }}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Metric 수정" : "Metric 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <>
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
                <div className="space-y-2">
                  <Label>Metric Key</Label>
                  <Select value={metricKey} onValueChange={setMetricKey}>
                    <SelectTrigger><SelectValue placeholder="KPI 선택" /></SelectTrigger>
                    <SelectContent>
                      {kpiDefs.map((k) => (
                        <SelectItem key={k.metric_key} value={k.metric_key}>
                          {k.metric_label} ({k.metric_key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>기간 타입</Label>
                  <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">주간</SelectItem>
                      <SelectItem value="monthly">월간</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>기간 시작</Label>
                    <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>기간 종료</Label>
                    <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>값</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setValidationError("");
                }}
              />
              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
