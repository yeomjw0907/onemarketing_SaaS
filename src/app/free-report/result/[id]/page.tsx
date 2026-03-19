import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Instagram, Users, TrendingUp, Eye, Heart, MessageCircle,
  Sparkles, ArrowRight, BarChart2, RefreshCw, ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "내 인스타그램 성과 리포트 | 원마케팅",
};

interface ReportData {
  profile: {
    id: string;
    name: string;
    username: string;
    biography: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    profile_picture_url: string;
    website: string;
  };
  insights: Record<string, number>;
  engagement_rate: number;
  media: {
    id: string;
    caption: string;
    media_type: string;
    timestamp: string;
    thumbnail_url: string;
    media_url: string;
    like_count: number;
    comments_count: number;
  }[];
  ai_comment: string;
  fetched_at: string;
}

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

function engagementGrade(rate: number) {
  if (rate >= 6) return { label: "최상", color: "text-emerald-600" };
  if (rate >= 3) return { label: "좋음", color: "text-blue-600" };
  if (rate >= 1) return { label: "보통", color: "text-amber-600" };
  return { label: "개선 필요", color: "text-red-500" };
}

export default async function FreeReportResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc = await createServiceClient();

  const { data: session } = await svc
    .from("free_report_sessions")
    .select("*")
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session) notFound();

  const data = session.report_data as ReportData;
  const { profile, insights, engagement_rate, media, ai_comment } = data;
  const grade = engagementGrade(engagement_rate);

  const stats = [
    { icon: Users, label: "팔로워", value: fmt(Number(profile.followers_count)), sub: `팔로잉 ${fmt(Number(profile.follows_count))}` },
    { icon: Eye, label: "30일 도달", value: fmt(insights.reach ?? 0), sub: "순 계정 기준" },
    { icon: BarChart2, label: "30일 노출", value: fmt(insights.impressions ?? 0), sub: "전체 노출 횟수" },
    { icon: TrendingUp, label: "인게이지먼트율", value: `${engagement_rate.toFixed(2)}%`, sub: grade.label, valueColor: grade.color },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto border-b border-neutral-100">
        <Link href="/" className="text-sm font-bold text-neutral-950 hover:text-neutral-600 transition-colors">
          원마케팅
        </Link>
        <Link href="/free-report" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
          다시 분석
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-32 space-y-16">

        {/* 프로필 */}
        <div className="pt-16 flex items-center gap-5">
          {profile.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_picture_url}
              alt={profile.username}
              className="w-16 h-16 rounded-full object-cover border border-neutral-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
              <Instagram className="h-7 w-7 text-neutral-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-neutral-950">@{profile.username}</h1>
              <a
                href={`https://instagram.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-neutral-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {profile.name && <p className="text-neutral-500 text-sm mt-0.5">{profile.name}</p>}
            <p className="text-xs text-neutral-400 mt-1">
              게시물 {fmt(Number(profile.media_count))}개 · {new Date(data.fetched_at).toLocaleDateString("ko-KR")} 기준
            </p>
          </div>
        </div>

        {/* AI 진단 */}
        {ai_comment && (
          <div className="border-l-2 border-neutral-950 pl-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-semibold tracking-widest uppercase text-neutral-400">AI 진단</span>
            </div>
            <p className="text-neutral-700 leading-relaxed text-sm whitespace-pre-wrap">{ai_comment}</p>
          </div>
        )}

        {/* 핵심 지표 */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-8">
            핵심 지표 (최근 30일)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-neutral-950">
            {stats.map(({ icon: Icon, label, value, sub, valueColor }) => (
              <div key={label} className="border-b border-r border-neutral-100 last:border-r-0 p-6">
                <Icon className="h-4 w-4 text-neutral-300 mb-4" strokeWidth={1.5} />
                <p className={`text-3xl font-black tracking-tighter ${valueColor ?? "text-neutral-950"}`}>{value}</p>
                <p className="text-xs font-medium text-neutral-500 mt-1">{label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 인게이지먼트 등급 */}
        <div className="flex items-center justify-between border-t border-b border-neutral-100 py-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-2">인게이지먼트율 평가</p>
            <p className={`text-2xl font-black tracking-tight ${grade.color}`}>{grade.label}</p>
            <p className="text-xs text-neutral-400 mt-1">업종 평균 1~3% · 3% 이상이면 우수</p>
          </div>
          <p className={`text-5xl font-black tracking-tighter ${grade.color}`}>{engagement_rate.toFixed(1)}%</p>
        </div>

        {/* 최근 게시물 */}
        {media.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-6">
              최근 게시물
            </p>
            <div className="grid grid-cols-3 gap-2">
              {media.map((m) => (
                <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 group">
                  {(m.media_url || m.thumbnail_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.thumbnail_url || m.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Instagram className="h-6 w-6 text-neutral-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-sm font-medium text-white">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{m.like_count ?? 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{m.comments_count ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-neutral-950 pt-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-6">
            더 성장하고 싶다면
          </p>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tighter text-neutral-950 leading-tight mb-8">
            원마케팅과 함께<br />광고 성과를 극대화하세요
          </h3>
          <a
            href="https://pf.kakao.com/_xoNxmxj/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-neutral-950 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-neutral-800 transition-colors"
          >
            원마케팅 무료 상담 신청
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-neutral-400">카카오톡으로 바로 연결됩니다</p>
        </div>

        <p className="text-center text-xs text-neutral-300">
          이 리포트는 생성 후 2시간 동안 유효합니다 · 개인정보는 저장되지 않습니다
        </p>
      </main>
    </div>
  );
}
