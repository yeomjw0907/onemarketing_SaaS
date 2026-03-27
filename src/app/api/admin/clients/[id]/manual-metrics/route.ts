/**
 * GET    /api/admin/clients/[id]/manual-metrics — 클라이언트 수기 입력 성과 목록 조회
 * POST   /api/admin/clients/[id]/manual-metrics — 수기 입력 성과 추가
 * DELETE /api/admin/clients/[id]/manual-metrics — 수기 입력 성과 삭제 (body: { id })
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const VALID_CHANNEL_TYPES = [
  "EXPERIENTIAL",
  "SEO",
  "BLOG",
  "INFLUENCER",
  "OTHER",
] as const;
type ChannelType = (typeof VALID_CHANNEL_TYPES)[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("manual_metrics")
      .select("*")
      .eq("client_id", clientId)
      .order("period_start", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ manual_metrics: data ?? [] });
  } catch (err) {
    console.error("[admin/clients/manual-metrics GET]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: clientId } = await params;
    const body = await req.json();
    const {
      channel_type,
      channel_name,
      period_start,
      period_end,
      metrics,
      memo,
    } = body as {
      channel_type: ChannelType;
      channel_name?: string;
      period_start: string;
      period_end: string;
      metrics?: Record<string, unknown>;
      memo?: string;
    };

    if (!channel_type) {
      return NextResponse.json({ error: "channel_type 필수" }, { status: 400 });
    }
    if (!VALID_CHANNEL_TYPES.includes(channel_type)) {
      return NextResponse.json(
        {
          error: `channel_type은 ${VALID_CHANNEL_TYPES.join(", ")} 중 하나여야 합니다.`,
        },
        { status: 400 }
      );
    }
    if (!period_start) {
      return NextResponse.json({ error: "period_start 필수" }, { status: 400 });
    }
    if (!period_end) {
      return NextResponse.json({ error: "period_end 필수" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("manual_metrics")
      .insert({
        client_id: clientId,
        channel_type,
        channel_name: channel_name ?? null,
        period_start,
        period_end,
        metrics: metrics ?? {},
        memo: memo ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ manual_metric: data }, { status: 201 });
  } catch (err) {
    console.error("[admin/clients/manual-metrics POST]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    // clientId is available via params but deletion is by record id
    await params;
    const body = await req.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "id 필수" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("manual_metrics")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/clients/manual-metrics DELETE]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
