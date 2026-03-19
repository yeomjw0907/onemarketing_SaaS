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
  if (rate >= 6) return { label: "최상", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (rate >= 3) return { label: "좋음", color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" };
  if (rate >= 1) return { label: "보통", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" };
  return         { label: "개선 필요", color: "text-red-400",       bg: "bg-red-500/10 border-red-500/20" };
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
    {
      icon: Users,
      label: "팔로워",
      value: fmt(Number(profile.followers_count)),
      sub: `팔로잉 ${fmt(Number(profile.follows_count))}`,
      color: "from-pink-500/20 to-violet-500/20",
      iconColor: "text-pink-300",
    },
    {
      icon: Eye,
      label: "30일 도달",
      value: fmt(insights.reach ?? 0),
      sub: "순 계정 기준",
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-300",
    },
    {
      icon: BarChart2,
      label: "30일 노출",
      value: fmt(insights.impressions ?? 0),
      sub: "전체 노출 횟수",
      color: "from-violet-500/20 to-indigo-500/20",
      iconColor: "text-violet-300",
    },
    {
      icon: TrendingUp,
      label: "인게이지먼트율",
      value: `${engagement_rate.toFixed(2)}%`,
      sub: grade.label,
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-300",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="font-bold text-lg tracking-tight text-white/80 hover:text-white transition-colors">
          원마케팅
        </Link>
        <Link href="/free-report" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
          다시 분석
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-24 space-y-8">

        {/* 프로필 헤더 */}
        <div className="flex items-center gap-5 pt-8">
          {profile.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_picture_url}
              alt={profile.username}
              className="w-16 h-16 rounded-full border-2 border-pink-500/40 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
              <Instagram className="h-7 w-7 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">@{profile.username}</h1>
              <a
                href={`https://instagram.com/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {profile.name && <p className="text-white/50 text-sm">{profile.name}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs bg-pink-500/10 border border-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">
                게시물 {fmt(Number(profile.media_count))}개
              </span>
              <span className="text-xs text-white/30">
                {new Date(data.fetched_at).toLocaleDateString("ko-KR")} 기준
              </span>
            </div>
          </div>
        </div>

        {/* AI 진단 */}
        {ai_comment && (
          <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span className="text-sm font-semibold text-violet-300">AI 진단</span>
            </div>
            <p className="text-white/80 leading-relaxed text-sm whitespace-pre-wrap">{ai_comment}</p>
          </div>
        )}

        {/* 핵심 지표 */}
        <div>
          <h2 className="text-base font-semibold text-white/70 mb-4">핵심 지표 (최근 30일)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ icon: Icon, label, value, sub, color, iconColor }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-white/50 mt-0.5">{label}</p>
                <p className={`text-xs mt-1 ${label === "인게이지먼트율" ? grade.color : "text-white/30"}`}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 인게이지먼트 등급 */}
        <div className={`border rounded-2xl p-5 ${grade.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">인게이지먼트율 평가</p>
              <p className={`text-2xl font-bold mt-1 ${grade.color}`}>{grade.label}</p>
              <p className="text-xs text-white/40 mt-1">
                평균 인게이지먼트율: 업종별 1~3% (3% 이상이면 우수)
              </p>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold ${grade.color}`}>{engagement_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* 최근 게시물 */}
        {media.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-white/70 mb-4">최근 게시물</h2>
            <div className="grid grid-cols-3 gap-2">
              {media.map((m) => (
                <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 group">
                  {(m.media_url || m.thumbnail_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.thumbnail_url || m.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Instagram className="h-6 w-6 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-sm font-medium">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-pink-400" />{m.like_count ?? 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-blue-400" />{m.comments_count ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-indigo-500/10 border border-white/10 rounded-3xl p-8 text-center">
          <p className="text-white/50 text-sm mb-2">더 전문적인 성장을 원하신다면</p>
          <h3 className="text-2xl font-bold mb-3">
            원마케팅과 함께<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
              광고 성과를 극대화하세요
            </span>
          </h3>
          <p className="text-white/40 text-sm mb-6 leading-relaxed">
            인스타그램 오가닉 성장부터 Meta/Google 광고 집행까지<br />
            데이터 기반으로 함께 성장합니다.
          </p>
          <a
            href="https://pf.kakao.com/_xoNxmxj/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all hover:scale-105"
          >
            원마케팅 무료 상담 신청
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-white/30">카카오톡으로 바로 연결됩니다</p>
        </div>

        <p className="text-center text-xs text-white/20 pb-4">
          이 리포트는 생성 후 2시간 동안 유효합니다 · 개인정보는 저장되지 않습니다
        </p>
      </main>
    </div>
  );
}
