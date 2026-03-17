/**
 * GET  /api/reports/[id]/comments  — 리포트 댓글 목록
 * POST /api/reports/[id]/comments  — 댓글(+ 피드백) 작성
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyReportFeedback } from "@/lib/notifications/alimtalk";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_comments")
    .select("id, author_name, body, reaction, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const supabase = await createClient();

  // 현재 로그인 사용자 확인
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id, display_name, role")
    .eq("user_id", user.id)
    .single();

  if (!profile?.client_id) {
    return NextResponse.json({ error: "클라이언트 계정이 아닙니다." }, { status: 403 });
  }

  const body = await req.json();
  const { text, reaction } = body as { text?: string; reaction?: string | null };

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "내용을 입력해 주세요." }, { status: 400 });
  }
  if (text.trim().length > 2000) {
    return NextResponse.json({ error: "2000자 이내로 입력해 주세요." }, { status: 400 });
  }
  if (reaction && !["approved", "rejected"].includes(reaction)) {
    return NextResponse.json({ error: "올바르지 않은 reaction 값입니다." }, { status: 400 });
  }

  // 리포트가 현재 클라이언트의 것인지 확인 (알림톡용 title, clients(name) 포함)
  const { data: report } = await supabase
    .from("reports")
    .select("id, client_id, title, clients(name)")
    .eq("id", reportId)
    .eq("client_id", profile.client_id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: comment, error: insertErr } = await supabase
    .from("report_comments")
    .insert({
      report_id: reportId,
      client_id: profile.client_id,
      author_id: user.id,
      author_name: profile.display_name,
      body: text.trim(),
      reaction: reaction ?? null,
    })
    .select("id, author_name, body, reaction, created_at")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 어드민에게 피드백 알림톡 발송 (fire-and-forget)
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE;
  if (adminPhone) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    notifyReportFeedback({
      to: adminPhone,
      clientName: (report.clients as { name?: string } | null)?.name ?? "클라이언트",
      reportTitle: (report as any).title ?? "리포트",
      reaction: (reaction as "approved" | "rejected" | null) ?? null,
      body: text.trim(),
      reportUrl: `${appUrl}/admin/reports/${reportId}`,
    }).catch((e) => console.error("[feedback notify]", e));
  }

  return NextResponse.json({ comment }, { status: 201 });
}
