"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatPhoneDisplay } from "@/lib/utils";
import {
  Bell, Send, CheckCircle, XCircle, AlertTriangle, PhoneCall, Info,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

interface NotificationLog {
  id: string;
  client_id: string | null;
  notification_type: string;
  recipient_phone: string | null;
  success: boolean;
  message_id: string | null;
  error_message: string | null;
  payload: any;
  created_at: string;
}

interface Props {
  clients: Client[];
  logs: NotificationLog[];
}

const ENV_VARS = [
  { key: "SOLAPI_API_KEY", label: "솔라피 API Key", required: true },
  { key: "SOLAPI_API_SECRET", label: "솔라피 API Secret", required: true },
  { key: "SOLAPI_PFID", label: "카카오톡 채널 프로필 ID", required: true },
  { key: "SOLAPI_SENDER_NUMBER", label: "발신번호 (SMS 대체용)", required: false },
];

export function NotificationSettings({ clients, logs }: Props) {
  const [selectedClient, setSelectedClient] = useState("");
  const [testType, setTestType] = useState("report_published");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleTestSend = async () => {
    if (!selectedClient) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: testType,
          clientId: selectedClient,
          data: {
            reportTitle: "[테스트] 주간 마케팅 리포트",
            reportUrl: `${window.location.origin}/reports`,
            actionTitle: "테스트 액션",
            oldStatus: "planned",
            newStatus: "in_progress",
            eventTitle: "테스트 일정",
            eventDate: new Date().toISOString().split("T")[0],
          },
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const activeClients = clients.filter((c) => c.is_active);
  const clientsWithPhone = activeClients.filter((c) => c.contact_phone);
  const clientsWithoutPhone = activeClients.filter((c) => !c.contact_phone);

  return (
    <div className="space-y-6">
      {/* ── 설정 안내 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            환경 설정 안내
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            카카오 알림톡을 사용하려면 <strong>솔라피(Solapi)</strong> 계정과 카카오톡 비즈니스 채널이 필요합니다.
            아래 환경 변수를 <code className="bg-muted px-1 rounded">.env.local</code>에 추가하세요.
          </p>
          <div className="grid gap-2">
            {ENV_VARS.map((v) => (
              <div key={v.key} className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg bg-muted/30">
                <code className="text-xs font-mono flex-1 min-w-0 truncate">{v.key}</code>
                <span className="text-muted-foreground text-xs hidden sm:block">{v.label}</span>
                {v.required && <Badge variant="outline" className="text-[10px] shrink-0">필수</Badge>}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
              알림톡 발송을 위해서는 카카오 비즈니스 채널에서 메시지 템플릿을 미리 등록해야 합니다.
              템플릿 ID는 <code>src/lib/notifications/alimtalk.ts</code>의 <code>TEMPLATE_IDS</code>에서 관리합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── 클라이언트 전화번호 현황 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-500" />
            수신 가능 클라이언트 ({clientsWithPhone.length}/{activeClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientsWithoutPhone.length > 0 && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-xs text-rose-700">
                <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                전화번호 미등록 클라이언트: {clientsWithoutPhone.map((c) => c.name).join(", ")}
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회사명</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeClients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.contact_name || "-"}</TableCell>
                    <TableCell className="text-sm font-mono">{formatPhoneDisplay(c.contact_phone) || "-"}</TableCell>
                    <TableCell>
                      {c.contact_phone ? (
                        <Badge variant="done" className="text-[10px]">
                          <CheckCircle className="h-3 w-3 mr-1" /> 수신 가능
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          <XCircle className="h-3 w-3 mr-1" /> 번호 없음
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 테스트 발송 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-500" />
            테스트 발송
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="클라이언트 선택" />
              </SelectTrigger>
              <SelectContent>
                {clientsWithPhone.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="report_published">보고서 발행 알림</SelectItem>
                <SelectItem value="action_status">액션 상태 변경 알림</SelectItem>
                <SelectItem value="event_reminder">일정 리마인더</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleTestSend}
              disabled={!selectedClient || sending}
              className="w-full sm:w-auto"
            >
              <Bell className="h-4 w-4 mr-2" />
              {sending ? "발송 중..." : "테스트 발송"}
            </Button>
          </div>
          {result && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {result.success
                ? "✅ 알림톡 발송 성공!"
                : `❌ 발송 실패: ${result.error || "알 수 없는 오류"}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 발송 이력 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 발송 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">발송 이력이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>수신번호</TableHead>
                    <TableHead>결과</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{formatDateTime(log.created_at)}</TableCell>
                        <TableCell className="text-xs">{log.notification_type?.replace("alimtalk_", "") || "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{formatPhoneDisplay(log.recipient_phone) || "-"}</TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="done" className="text-[10px]">성공</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">{log.error_message?.slice(0, 30) || "실패"}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
