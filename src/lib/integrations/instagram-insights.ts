/**
 * Instagram Graph API v21.0 래퍼
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export interface IgAccountInfo {
  igId: string;
  username: string;
  followersCount: number;
  mediaCount: number;
  profilePictureUrl: string;
}

export interface IgDailyStat {
  date: string;
  followersCount: number;
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
}

export interface IgMedia {
  id: string;
  mediaType: string;
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

export interface IgMediaInsights {
  saved: number;
  reach: number;
  impressions: number;
}

async function graphGet(path: string, token: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const errObj = err?.error as Record<string, unknown> | undefined;
    throw new Error((errObj?.message as string) ?? `Graph API ${res.status}: ${path}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Page의 Instagram Business Account 정보 조회
 * pageAccessToken: 페이지 액세스 토큰
 * pageId: Facebook Page ID
 */
export async function fetchIgAccountInfo(
  pageAccessToken: string,
  pageId: string,
): Promise<IgAccountInfo> {
  const data = await graphGet(`/${pageId}/instagram_business_account`, pageAccessToken, {
    fields: "id,username,followers_count,media_count,profile_picture_url",
  });

  const iba = data.instagram_business_account as Record<string, unknown> | undefined;
  if (!iba?.id) {
    throw new Error("Instagram Business Account를 찾을 수 없습니다.");
  }

  return {
    igId: iba.id as string,
    username: (iba.username as string) ?? "",
    followersCount: Number(iba.followers_count) || 0,
    mediaCount: Number(iba.media_count) || 0,
    profilePictureUrl: (iba.profile_picture_url as string) ?? "",
  };
}

/**
 * 일별 인사이트 조회
 */
export async function fetchIgDailyInsights(
  igId: string,
  accessToken: string,
  since: string,
  until: string,
): Promise<IgDailyStat[]> {
  const data = await graphGet(`/${igId}/insights`, accessToken, {
    metric: "follower_count,impressions,reach,profile_views,website_clicks",
    period: "day",
    since,
    until,
  }).catch(() => ({ data: [] }));

  const items = (data.data as Record<string, unknown>[]) ?? [];

  // metric별 date->value 맵
  const byMetric: Record<string, Record<string, number>> = {};
  for (const item of items) {
    const name = item.name as string;
    const values = (item.values as { value: number; end_time: string }[]) ?? [];
    byMetric[name] = {};
    for (const v of values) {
      const date = v.end_time?.split("T")[0] ?? "";
      if (date) byMetric[name][date] = v.value || 0;
    }
  }

  // 날짜 집합 수집
  const dateSet = new Set<string>();
  for (const metricData of Object.values(byMetric)) {
    for (const date of Object.keys(metricData)) {
      dateSet.add(date);
    }
  }

  return Array.from(dateSet)
    .sort()
    .map((date) => ({
      date,
      followersCount: byMetric.follower_count?.[date] ?? 0,
      impressions: byMetric.impressions?.[date] ?? 0,
      reach: byMetric.reach?.[date] ?? 0,
      profileViews: byMetric.profile_views?.[date] ?? 0,
      websiteClicks: byMetric.website_clicks?.[date] ?? 0,
    }));
}

/**
 * 최근 게시물 목록 조회
 */
export async function fetchIgRecentMedia(
  igId: string,
  accessToken: string,
  limit = 20,
): Promise<IgMedia[]> {
  const data = await graphGet(`/${igId}/media`, accessToken, {
    fields: "id,media_type,caption,media_url,thumbnail_url,timestamp,like_count,comments_count",
    limit: String(limit),
  }).catch(() => ({ data: [] }));

  const items = (data.data as Record<string, unknown>[]) ?? [];
  return items.map((m) => ({
    id: m.id as string,
    mediaType: (m.media_type as string) ?? "IMAGE",
    caption: (m.caption as string) ?? null,
    mediaUrl: (m.media_url as string) ?? null,
    thumbnailUrl: (m.thumbnail_url as string) ?? null,
    timestamp: (m.timestamp as string) ?? "",
    likeCount: Number(m.like_count) || 0,
    commentsCount: Number(m.comments_count) || 0,
  }));
}

/**
 * 게시물 인사이트 조회
 * 미디어 타입에 따라 다른 metrics 사용
 */
export async function fetchIgMediaInsights(
  mediaId: string,
  accessToken: string,
  mediaType: string,
): Promise<IgMediaInsights> {
  let metric = "saved,reach,impressions";
  if (mediaType === "STORY") {
    metric = "exits,impressions,reach,replies,taps_back,taps_forward";
  } else if (mediaType === "REEL") {
    metric = "comments,likes,plays,reach,saved,shares,total_interactions";
  }

  const data = await graphGet(`/${mediaId}/insights`, accessToken, { metric }).catch(() => ({
    data: [],
  }));

  const items = (data.data as Record<string, unknown>[]) ?? [];
  const result: IgMediaInsights = { saved: 0, reach: 0, impressions: 0 };

  for (const item of items) {
    const name = item.name as string;
    const value = Number(item.values?.[0]?.value ?? item.value ?? 0);
    if (name === "saved") result.saved = value;
    else if (name === "reach") result.reach = value;
    else if (name === "impressions" || name === "plays") result.impressions = value;
  }

  return result;
}
