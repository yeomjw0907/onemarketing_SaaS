import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST — 공지 등록
export async function POST(req: NextRequest) {
  await requireAdmin();
  const supabase = await createClient();
  const body = await req.json();

  const { title, content, is_pinned } = body as {
    title: string;
    content: string | null;
    is_pinned: boolean;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "제목을 입력하세요." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({ title: title.trim(), content: content || null, is_pinned: !!is_pinned })
    .select()
    .single();

  if (error) {
    console.error("[announcements POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE — 공지 삭제 (?id=...)
export async function DELETE(req: NextRequest) {
  await requireAdmin();
  const supabase = await createClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    console.error("[announcements DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
