"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CreditCard, AlertCircle, CheckCircle2, Clock, Loader2,
  Users, Plus, Trash2, Mail, Crown, Eye, ShieldCheck, Copy, Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Props {
  agency: Record<string, string> | null;
  subscription: Record<string, string> | null;
  plan: Record<string, unknown> | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  trialing: { label: "무료 체험 중", variant: "secondary" },
  active:   { label: "구독 중", variant: "default" },
  past_due: { label: "결제 실패", variant: "destructive" },
  cancelled:{ label: "취소됨", variant: "outline" },
  expired:  { label: "만료됨", variant: "destructive" },
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  starter: { monthly: 99000, yearly: 79000 * 12, name: "스타터" },
  pro:     { monthly: 199000, yearly: 159000 * 12, name: "프로" },
  agency:  { monthly: 399000, yearly: 319000 * 12, name: "에이전시" },
};

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner:   { label: "오너",    icon: Crown,       color: "text-amber-500" },
  manager: { label: "매니저",  icon: ShieldCheck,  color: "text-blue-500" },
  viewer:  { label: "뷰어",    icon: Eye,          color: "text-slate-500" },
};

interface TeamMember {
  user_id: string;
  display_name: string;
  email: string;
  agency_role: string;
  created_at: string;
}

interface PendingInvite {
  id: string;
  invited_email: string;
  invited_role: string;
  created_at: string;
  expires_at: string;
}

export default function BillingClient({ agency, subscription, plan }: Props) {
  const [payLoading, setPayLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const searchParams = useSearchParams();

  // 팀 멤버 상태
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "viewer">("manager");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("결제가 완료되었습니다. 구독이 활성화되었습니다.");
    } else if (searchParams.get("paymentFailed") === "1") {
      toast.error("결제에 실패했습니다. 다시 시도해 주세요.");
    } else if (searchParams.get("expired") === "1") {
      toast.error("구독이 만료되어 서비스 이용이 제한됩니다. 결제를 완료해 주세요.");
    }
  }, [searchParams]);

  const fetchTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
        setPendingInvites(data.pendingInvites ?? []);
      }
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("이메일을 입력해 주세요.");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitedEmail: inviteEmail.trim(), invitedRole: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "초대에 실패했습니다.");
        return;
      }
      setInviteUrl(data.inviteUrl);
      await fetchTeam();
      toast.success("초대 링크가 생성되었습니다.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`${name}님을 팀에서 제거할까요?`)) return;
    try {
      const res = await fetch("/api/admin/team/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "제거에 실패했습니다.");
        return;
      }
      toast.success("팀원이 제거되었습니다.");
      await fetchTeam();
    } catch {
      toast.error("서버 오류가 발생했습니다.");
    }
  };

  const copyInviteUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteUrl("");
    setCopied(false);
  };

  const status = subscription?.status ?? "trialing";
  const statusInfo = STATUS_MAP[status] ?? { label: status, variant: "outline" as const };
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const isExpired = status === "expired" || status === "cancelled";
  const isTrialing = status === "trialing";
  const planKey = (subscription?.plan_key ?? "starter") as string;
  const planPrice = PLAN_PRICES[planKey];

  const handlePayment = async () => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      toast.error("결제 설정이 완료되지 않았습니다. (NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정)");
      return;
    }
    if (!agency?.id) {
      toast.error("에이전시 정보를 찾을 수 없습니다.");
      return;
    }

    setPayLoading(true);
    try {
      const { loadTossPayments } = await import("@tosspayments/payment-sdk");
      const toss = await loadTossPayments(clientKey);

      const amount = billingCycle === "yearly"
        ? (planPrice?.yearly ?? 99000 * 12)
        : (planPrice?.monthly ?? 99000);

      const orderId = `agency_${agency.id}_${Date.now()}`;
      const orderName = `ONEmarketing ${planPrice?.name ?? planKey} (${billingCycle === "yearly" ? "연간" : "월간"})`;

      await toss.requestPayment("카드", {
        amount,
        orderId,
        orderName,
        customerName: agency.name,
        successUrl: `${window.location.origin}/api/payments/confirm?agencyId=${agency.id}&planKey=${planKey}&billingCycle=${billingCycle}`,
        failUrl: `${window.location.origin}/admin/billing?paymentFailed=1`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "결제 중 오류가 발생했습니다.";
      if (!msg.includes("취소")) toast.error(msg);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-muted-foreground text-sm mt-1">구독, 팀 멤버, 에이전시 정보를 관리하세요.</p>
      </div>

      <Tabs defaultValue="billing">
        <TabsList>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-1.5" />
            구독 관리
          </TabsTrigger>
          <TabsTrigger value="team" onClick={fetchTeam}>
            <Users className="h-4 w-4 mr-1.5" />
            팀 관리
          </TabsTrigger>
        </TabsList>

        {/* ── 구독 관리 탭 ── */}
        <TabsContent value="billing" className="space-y-6 mt-4">
          {/* 만료 경고 */}
          {isExpired && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">구독이 만료되었습니다.</p>
                <p className="text-destructive/80 mt-0.5">결제를 완료하면 즉시 서비스를 다시 이용할 수 있습니다.</p>
              </div>
            </div>
          )}

          {/* 체험 종료 임박 안내 */}
          {isTrialing && periodEnd && (periodEnd.getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300">
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">무료 체험이 곧 종료됩니다.</p>
                <p className="mt-0.5 opacity-80">체험 종료 전 결제를 완료하면 서비스가 중단 없이 유지됩니다.</p>
              </div>
            </div>
          )}

          {/* 현재 플랜 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">현재 플랜</CardTitle>
                </div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">플랜</p>
                  <p className="font-medium mt-0.5">{(plan?.name as string) ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">클라이언트 한도</p>
                  <p className="font-medium mt-0.5">
                    {(plan?.max_clients as number | null) ? `최대 ${plan?.max_clients}개` : "무제한"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {isTrialing ? "체험 종료일" : isExpired ? "만료일" : "다음 결제일"}
                  </p>
                  <p className="font-medium mt-0.5 flex items-center gap-1.5">
                    {isTrialing && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                    {isExpired && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    {!isExpired && !isTrialing && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    {periodEnd ? format(periodEnd, "yyyy년 M월 d일", { locale: ko }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">결제 방식</p>
                  <p className="font-medium mt-0.5">
                    {subscription?.billing_cycle === "yearly" ? "연간 결제" : "월간 결제"}
                  </p>
                </div>
              </div>

              {/* 결제 섹션 */}
              {(isExpired || isTrialing) && planPrice && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">결제 방식 선택</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`flex-1 rounded-lg border p-3 text-sm text-left transition-all ${
                        billingCycle === "monthly" ? "border-primary bg-primary/5" : "hover:border-border/80"
                      }`}
                    >
                      <p className="font-medium">월간 결제</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{planPrice.monthly.toLocaleString()}원/월</p>
                    </button>
                    <button
                      onClick={() => setBillingCycle("yearly")}
                      className={`flex-1 rounded-lg border p-3 text-sm text-left transition-all ${
                        billingCycle === "yearly" ? "border-primary bg-primary/5" : "hover:border-border/80"
                      }`}
                    >
                      <p className="font-medium">연간 결제 <span className="text-xs text-green-600 ml-1">20% 절약</span></p>
                      <p className="text-muted-foreground text-xs mt-0.5">{planPrice.yearly.toLocaleString()}원/년</p>
                    </button>
                  </div>
                  <Button className="w-full" size="lg" onClick={handlePayment} disabled={payLoading}>
                    {payLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />결제창 열는 중...</>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {billingCycle === "yearly"
                          ? `${planPrice.yearly.toLocaleString()}원 결제하기 (연간)`
                          : `${planPrice.monthly.toLocaleString()}원 결제하기 (월간)`}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!isExpired && !isTrialing && (
                <div className="flex gap-3 pt-2 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => window.location.href = "/onboarding/plan"}>
                    플랜 변경
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handlePayment} disabled={payLoading}>
                    {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "결제 수단 변경"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 에이전시 정보 */}
          {agency && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">에이전시 정보</CardTitle>
                <CardDescription>청구서에 표시되는 정보입니다.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex gap-4">
                  <span className="text-muted-foreground w-20 shrink-0">에이전시명</span>
                  <span className="font-medium">{agency.name}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-sm text-muted-foreground text-center">
            플랜 비교가 필요하신가요?{" "}
            <a href="/#pricing" className="text-primary hover:underline">가격 안내 보기</a>
          </p>
        </TabsContent>

        {/* ── 팀 관리 탭 ── */}
        <TabsContent value="team" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    팀 멤버
                  </CardTitle>
                  <CardDescription className="mt-1">
                    대행사 어드민 계정을 관리합니다. 오너만 초대 및 제거할 수 있습니다.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  팀원 초대
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">로딩 중...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 현재 멤버 테이블 */}
                  {members.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>역할</TableHead>
                          <TableHead>가입일</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => {
                          const roleInfo = ROLE_LABELS[member.agency_role] ?? ROLE_LABELS.viewer;
                          const RoleIcon = roleInfo.icon;
                          return (
                            <TableRow key={member.user_id}>
                              <TableCell className="font-medium">{member.display_name || "—"}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                              <TableCell>
                                <span className={`flex items-center gap-1 text-sm ${roleInfo.color}`}>
                                  <RoleIcon className="h-3.5 w-3.5" />
                                  {roleInfo.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(member.created_at), "yyyy.MM.dd", { locale: ko })}
                              </TableCell>
                              <TableCell>
                                {member.agency_role !== "owner" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveMember(member.user_id, member.display_name)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {/* 대기 중인 초대 */}
                  {pendingInvites.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                        초대 대기 중
                      </p>
                      <div className="space-y-2">
                        {pendingInvites.map((invite) => {
                          const roleInfo = ROLE_LABELS[invite.invited_role] ?? ROLE_LABELS.viewer;
                          return (
                            <div
                              key={invite.id}
                              className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{invite.invited_email}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(invite.expires_at), "M/d까지", { locale: ko })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {members.length === 0 && pendingInvites.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      팀원이 없습니다. 팀원을 초대해 보세요.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 역할 안내 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                역할 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { role: "owner", desc: "전체 설정, 결제, 팀 관리 등 모든 권한" },
                { role: "manager", desc: "클라이언트 관리, 리포트 발행, 알림톡 발송" },
                { role: "viewer", desc: "조회 전용 — 데이터 수정 불가" },
              ].map(({ role, desc }) => {
                const info = ROLE_LABELS[role];
                const Icon = info.icon;
                return (
                  <div key={role} className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${info.color}`} />
                    <div>
                      <span className="font-medium">{info.label}</span>
                      <span className="text-muted-foreground ml-2">{desc}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 팀원 초대 다이얼로그 */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => { if (!open) handleCloseInviteDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>팀원 초대</DialogTitle>
          </DialogHeader>

          {!inviteUrl ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">이메일</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="team@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>역할</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as "manager" | "viewer")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">매니저 — 클라이언트 관리 + 발송 가능</SelectItem>
                    <SelectItem value="viewer">뷰어 — 조회 전용</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                아래 초대 링크를 복사해 팀원에게 전달하세요. 7일간 유효합니다.
              </p>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="text-xs font-mono" />
                <Button variant="outline" size="icon" onClick={copyInviteUrl}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {!inviteUrl ? (
              <>
                <Button variant="outline" onClick={handleCloseInviteDialog}>취소</Button>
                <Button onClick={handleInvite} disabled={inviteLoading}>
                  {inviteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />처리 중...</> : "초대 링크 생성"}
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={handleCloseInviteDialog}>닫기</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
