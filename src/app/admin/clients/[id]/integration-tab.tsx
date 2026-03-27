"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, X, Unplug, RefreshCw, Trash2, Zap, TestTube2,
  ExternalLink, Settings, BookOpen, BarChart2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import type { DataIntegration, IntegrationPlatform, IntegrationStatus } from "@/lib/types/database";

// ── 플랫폼별 값 넣는 위치 가이드 ──
const INTEGRATION_GUIDES: Record<string, { title: string; env?: string[]; steps: string[]; fields: { name: string; where: string }[] }> = {
  naver_ads: {
    title: "네이버 검색광고",
    env: [],
    steps: [
      "네이버 검색광고에 광고주로 가입 후 로그인",
      "도구 → API 관리 → 라이선스 발급",
      "발급된 API Key, Secret Key, Customer ID를 아래 입력란에 넣습니다.",
    ],
    fields: [
      { name: "API Key", where: "네이버 검색광고 API 관리 → 라이선스 발급 후 표시되는 API Key" },
      { name: "Secret Key", where: "같은 화면에서 발급된 Secret Key (한 번만 표시되므로 안전하게 보관)" },
      { name: "Customer ID", where: "네이버 검색광고 계정의 고객 ID (숫자, API 관리 화면 또는 계정 설정에서 확인)" },
    ],
  },
  meta_ads: {
    title: "Meta 광고 (Facebook/Instagram)",
    env: ["META_APP_ID", "META_APP_SECRET", "NEXT_PUBLIC_APP_URL (OAuth 콜백용)"],
    steps: [
      "권장: 상단 [Meta OAuth] 버튼 클릭 → App ID 입력(.env.local의 META_APP_ID) → Facebook 인증 → 돌아온 뒤 광고 계정 ID만 아래에 입력 후 연동 저장",
      "또는 Meta for Developers에서 앱 생성 후 액세스 토큰·광고 계정 ID를 직접 발급해 입력",
      "광고 계정 ID: Meta 비즈니스 설정 → 광고 계정 → ID 확인 (act_숫자 형식)",
    ],
    fields: [
      { name: "Access Token", where: "Meta OAuth 버튼 사용 시 자동. 직접 입력 시 Developers 앱에서 토큰 생성" },
      { name: "Ad Account ID", where: "business.facebook.com → 설정 → 광고 계정 → 광고 계정 ID (act_123456789)" },
    ],
  },
  google_ads: {
    title: "Google Ads",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL", "GOOGLE_DEVELOPER_TOKEN(선택, .env에 넣으면 연동마다 입력 안 함)"],
    steps: [
      "상단 [Google OAuth] 버튼 클릭 → Client ID 입력(.env.local의 GOOGLE_CLIENT_ID) → Google 로그인 동의",
      "돌아온 URL에 googleRefreshToken=... 이 붙어 있으므로 복사해 아래 Refresh Token란에 붙여넣기",
      "Customer ID: ads.google.com → 도구 및 설정 → 설정에서 확인. Developer Token: API 센터에서 발급 (또는 .env에 GOOGLE_DEVELOPER_TOKEN 한 번 넣으면 연동마다 입력 생략)",
    ],
    fields: [
      { name: "Refresh Token", where: "Google OAuth 후 리다이렉트 URL의 googleRefreshToken 값 복사" },
      { name: "Customer ID", where: "Google Ads → 도구 및 설정 → 설정 → 고객 ID (123-456-7890 또는 숫자만)" },
      { name: "Developer Token", where: "API 센터에서 발급. .env에 GOOGLE_DEVELOPER_TOKEN 넣으면 여기 비워도 됨(원케이션 1세트)" },
    ],
  },
  google_analytics: {
    title: "Google Analytics (GA4)",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"],
    steps: [
      "Google OAuth는 Google Ads와 동일. Refresh Token은 위 [Google OAuth]로 발급 후 URL에서 복사",
      "Property ID: GA4 관리 → 속성 → 속성 설정 → 속성 ID (숫자). 입력 시 properties/123456789 형식",
    ],
    fields: [
      { name: "Refresh Token", where: "Google OAuth 버튼으로 인증 후 URL의 googleRefreshToken 복사" },
      { name: "Property ID", where: "GA4 관리 → 속성 → 속성 설정 → 속성 ID → properties/숫자 형식으로 입력" },
    ],
  },
  google_search_console: {
    title: "Google Search Console (SEO)",
    env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL"],
    steps: [
      "Google OAuth 버튼으로 인증 후 Refresh Token 복사 (Google Ads·GA4와 동일한 OAuth 계정 사용 가능)",
      "Site URL: Search Console에서 확인할 속성 URL (예: https://example.com/ 또는 sc-domain:example.com)",
    ],
    fields: [
      { name: "Refresh Token", where: "Google OAuth 버튼으로 인증 후 URL의 googleRefreshToken 복사" },
      { name: "Site URL", where: "Search Console → 속성 선택 → URL 그대로 복사 (https://... 또는 sc-domain:...)" },
    ],
  },
  kakao_moment: {
    title: "카카오모먼트 (Kakao Moment)",
    env: [],
    steps: [
      "카카오 비즈니스(https://business.kakao.com) → 카카오모먼트 → API 설정에서 액세스 토큰 발급",
      "광고 계정 ID: 카카오모먼트 대시보드 URL 또는 설정에서 확인",
    ],
    fields: [
      { name: "Access Token", where: "카카오 비즈니스 → 카카오모먼트 → API 설정 → 액세스 토큰" },
      { name: "Ad Account ID", where: "카카오모먼트 대시보드 상단 또는 URL에서 확인되는 광고 계정 ID (숫자)" },
    ],
  },
  tiktok_ads: {
    title: "TikTok Ads",
    env: [],
    steps: [
      "TikTok Business Center(https://ads.tiktok.com) → Assets → Business Center → API → 앱 생성",
      "또는 TikTok for Developers에서 앱 생성 후 Access Token 발급",
      "Advertiser ID: TikTok Ads Manager 대시보드 우상단 계정 정보에서 확인",
    ],
    fields: [
      { name: "Access Token", where: "TikTok for Developers → 앱 → Sandbox/Production Access Token" },
      { name: "Advertiser ID", where: "TikTok Ads Manager → 계정 정보 → Advertiser ID (18자리 숫자)" },
    ],
  },
  naver_gfa: {
    title: "네이버 성과형디스플레이광고 (GFA)",
    env: [],
    steps: [
      "네이버 광고(https://searchad.naver.com)와 다른 별도 플랫폼입니다",
      "GFA API(https://gfaapi.naver.com) 사용을 위해 네이버 GFA 고객센터에 API 사용 신청 필요",
      "발급된 API Key, Secret Key, Customer ID를 입력하세요",
    ],
    fields: [
      { name: "API Key", where: "네이버 GFA API 승인 후 발급되는 API Key" },
      { name: "Secret Key", where: "API Key와 함께 발급되는 Secret Key" },
      { name: "Customer ID", where: "GFA 계정의 고객 ID" },
    ],
  },
  shopify: {
    title: "Shopify",
    env: [],
    steps: [
      "Shopify 관리자 → 설정 → 앱 및 판매 채널 → 앱 개발 → 앱 만들기",
      "또는 Custom App 생성 → Admin API 액세스 토큰 발급",
      "Shop Domain: mystore.myshopify.com 형식으로 입력",
    ],
    fields: [
      { name: "Access Token", where: "Shopify 관리자 → 앱 → Custom App → Admin API 액세스 토큰" },
      { name: "Shop Domain", where: "Shopify 스토어 주소 (예: mystore.myshopify.com)" },
    ],
  },
  cafe24: {
    title: "카페24 (Cafe24)",
    env: [],
    steps: [
      "카페24 개발자 센터(https://developers.cafe24.com) → 앱 등록 → OAuth 앱 생성",
      "Mall ID: 카페24 쇼핑몰 ID (mystore.cafe24.com에서 mystore 부분)",
      "앱 인증 후 Refresh Token 발급 필요 (OAuth 2.0 흐름)",
    ],
    fields: [
      { name: "Mall ID", where: "카페24 쇼핑몰 주소에서 앞부분 (예: mystore)" },
      { name: "Client ID", where: "카페24 개발자센터 → 앱 정보 → Client ID" },
      { name: "Client Secret", where: "카페24 개발자센터 → 앱 정보 → Client Secret" },
      { name: "Refresh Token", where: "OAuth 2.0 인증 완료 후 발급되는 Refresh Token" },
    ],
  },
  linkedin_ads: {
    title: "LinkedIn Ads",
    env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "NEXT_PUBLIC_APP_URL (OAuth 콜백용)"],
    steps: [
      "권장: 상단 [LinkedIn OAuth] 버튼 클릭 → LinkedIn 로그인 동의 → 광고 계정 자동 연결",
      "LinkedIn Campaign Manager에 활성 광고 계정이 있어야 합니다.",
      "직접 입력 시: LinkedIn Marketing API에서 Access Token, Ad Account ID를 발급해 입력",
    ],
    fields: [
      { name: "Access Token", where: "LinkedIn OAuth 버튼 사용 시 자동. 직접 입력 시 LinkedIn Marketing API에서 발급" },
      { name: "Ad Account ID", where: "LinkedIn Campaign Manager → 광고 계정 설정 → 계정 ID (숫자만)" },
    ],
  },
};

const PLATFORM_OPTIONS: { value: IntegrationPlatform; label: string }[] = [
  { value: "meta_ads",              label: "Meta 광고 (Facebook/Instagram)" },
  { value: "google_ads",            label: "Google Ads" },
  { value: "google_analytics",      label: "Google Analytics (GA4)" },
  { value: "google_search_console", label: "Google Search Console (SEO)" },
  { value: "linkedin_ads",          label: "LinkedIn Ads" },
  { value: "naver_ads",             label: "네이버 검색광고" },
  { value: "naver_gfa",             label: "네이버 성과형디스플레이광고 (GFA)" },
  { value: "kakao_moment",          label: "카카오모먼트" },
  { value: "tiktok_ads",            label: "TikTok Ads" },
  { value: "shopify",               label: "Shopify" },
  { value: "cafe24",                label: "카페24" },
];

const PLATFORM_LABEL: Record<string, string> = {
  meta_ads:              "Meta Ads",
  google_ads:            "Google Ads",
  google_analytics:      "GA4",
  google_search_console: "Search Console",
  linkedin_ads:          "LinkedIn Ads",
  naver_ads:             "네이버 검색광고",
  naver_searchad:        "네이버 검색광고",
  naver_gfa:             "네이버 GFA",
  kakao_moment:          "카카오모먼트",
  tiktok_ads:            "TikTok Ads",
  shopify:               "Shopify",
  cafe24:                "카페24",
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  active: "활성", inactive: "비활성", error: "오류",
};

const SETTING_KEYS = ["META_APP_ID", "META_APP_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_DEVELOPER_TOKEN", "NEXT_PUBLIC_APP_URL"] as const;
const SETTING_LABELS: Record<string, string> = {
  META_APP_ID: "Meta App ID",
  META_APP_SECRET: "Meta App Secret",
  GOOGLE_CLIENT_ID: "Google Client ID",
  GOOGLE_CLIENT_SECRET: "Google Client Secret",
  GOOGLE_DEVELOPER_TOKEN: "Google Developer Token (선택)",
  NEXT_PUBLIC_APP_URL: "앱 URL (OAuth 콜백용)",
};

export function IntegrationTab({ clientId, initialIntegrations, router }: { clientId: string; initialIntegrations: DataIntegration[]; router: any }) {
  const searchParams = useSearchParams();
  const metaTokenFromUrl = searchParams.get("metaToken");
  const metaExpiresInFromUrl = searchParams.get("metaExpiresIn");
  const linkedInConnected = searchParams.get("linkedin") === "connected";
  const errorFromUrl = searchParams.get("error");

  const [integrations, setIntegrations] = useState<DataIntegration[]>(initialIntegrations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);

  const [oauthKeys, setOauthKeys] = useState<{ metaAppId: string | null; googleClientId: string | null; nextPublicAppUrl: string | null } | null>(null);
  const [adminSettings, setAdminSettings] = useState<Record<string, { value: string; masked: string }>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/oauth-keys");
        if (res.ok) setOauthKeys(await res.json());
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setAdminSettings(data);
          setSettingsForm(Object.fromEntries(SETTING_KEYS.map((k) => [k, data[k]?.value ?? ""])));
        }
      } catch { /* ignore */ }
    })();
  }, [settingsOpen]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#_=_") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const [metaSaveDisplayName, setMetaSaveDisplayName] = useState("Meta 광고");
  const [metaSaveAdAccountId, setMetaSaveAdAccountId] = useState("");
  const [metaSaveLoading, setMetaSaveLoading] = useState(false);

  const [platform, setPlatform] = useState<IntegrationPlatform>("meta_ads");
  const [displayName, setDisplayName] = useState("");
  const [naverApiKey, setNaverApiKey] = useState("");
  const [naverSecretKey, setNaverSecretKey] = useState("");
  const [naverCustomerId, setNaverCustomerId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState("");
  const [ga4PropertyId, setGA4PropertyId] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [kakaoAccessToken, setKakaoAccessToken] = useState("");
  const [kakaoAdAccountId, setKakaoAdAccountId] = useState("");
  const [tiktokAccessToken, setTiktokAccessToken] = useState("");
  const [tiktokAdvertiserId, setTiktokAdvertiserId] = useState("");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [cafe24MallId, setCafe24MallId] = useState("");
  const [cafe24ClientId, setCafe24ClientId] = useState("");
  const [cafe24ClientSecret, setCafe24ClientSecret] = useState("");
  const [cafe24RefreshToken, setCafe24RefreshToken] = useState("");
  const [linkedInAccessToken, setLinkedInAccessToken] = useState("");
  const [linkedInAdAccountId, setLinkedInAdAccountId] = useState("");
  const [autoKpi, setAutoKpi] = useState(true);

  const [ga4TargetPaths, setGa4TargetPaths] = useState<string[]>([]);
  const [ga4PathInput, setGa4PathInput] = useState("");
  const [ga4PathsSaving, setGa4PathsSaving] = useState(false);
  const [ga4PathsLoaded, setGa4PathsLoaded] = useState(false);

  useEffect(() => {
    const hasGA4 = integrations.some((i) => i.platform === "google_analytics");
    if (!hasGA4 || ga4PathsLoaded) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/integrations/ga4-pages?clientId=${clientId}`);
        if (res.ok) {
          const json = await res.json();
          setGa4TargetPaths(json.data?.targetPaths ?? []);
          setGa4PathsLoaded(true);
        }
      } catch { /* ignore */ }
    })();
  }, [integrations, clientId, ga4PathsLoaded]);

  const resetForm = () => {
    setPlatform("meta_ads"); setDisplayName(""); setTestResult(null); setAutoKpi(true);
    setNaverApiKey(""); setNaverSecretKey(""); setNaverCustomerId("");
    setMetaAccessToken(""); setMetaAdAccountId("");
    setGoogleRefreshToken(""); setGoogleCustomerId(""); setGoogleDeveloperToken(""); setGA4PropertyId(""); setGscSiteUrl("");
    setKakaoAccessToken(""); setKakaoAdAccountId("");
    setTiktokAccessToken(""); setTiktokAdvertiserId("");
    setShopifyAccessToken(""); setShopifyDomain("");
    setCafe24MallId(""); setCafe24ClientId(""); setCafe24ClientSecret(""); setCafe24RefreshToken("");
    setLinkedInAccessToken(""); setLinkedInAdAccountId("");
  };

  const buildCredentials = (): Record<string, string> => {
    switch (platform) {
      case "naver_ads":
      case "naver_searchad":
      case "naver_gfa":
        return { apiKey: naverApiKey, secretKey: naverSecretKey, customerId: naverCustomerId };
      case "meta_ads":
        return { accessToken: metaAccessToken, adAccountId: metaAdAccountId };
      case "google_ads":
        return { refreshToken: googleRefreshToken, customerId: googleCustomerId, developerToken: googleDeveloperToken };
      case "google_analytics":
        return { refreshToken: googleRefreshToken, propertyId: ga4PropertyId };
      case "google_search_console":
        return { refreshToken: googleRefreshToken, siteUrl: gscSiteUrl };
      case "kakao_moment":
        return { accessToken: kakaoAccessToken, adAccountId: kakaoAdAccountId };
      case "tiktok_ads":
        return { accessToken: tiktokAccessToken, advertiserId: tiktokAdvertiserId };
      case "shopify":
        return { accessToken: shopifyAccessToken, shopDomain: shopifyDomain };
      case "cafe24":
        return { mallId: cafe24MallId, clientId: cafe24ClientId, clientSecret: cafe24ClientSecret, refreshToken: cafe24RefreshToken };
      case "linkedin_ads":
        return { accessToken: linkedInAccessToken, adAccountId: linkedInAdAccountId };
      default:
        return {};
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, credentials: buildCredentials() }),
      });
      const data = await res.json();
      setTestResult(data.success ? "✅ 연결 성공!" : `❌ 연결 실패: ${data.error || "알 수 없는 오류"}`);
    } catch (err: any) {
      setTestResult(`❌ 테스트 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!displayName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, platform, displayName, credentials: buildCredentials() }),
      });
      if (res.ok) {
        if (autoKpi) {
          await fetch("/api/admin/kpis/auto-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, platform }),
          });
        }
        setDialogOpen(false);
        resetForm();
        router.refresh();
        const listRes = await fetch(`/api/admin/integrations?clientId=${clientId}`);
        if (listRes.ok) setIntegrations(await listRes.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 연동을 삭제하시겠습니까? 관련된 모든 지표 데이터가 삭제됩니다.")) return;
    await fetch(`/api/admin/integrations?id=${id}`, { method: "DELETE" });
    setIntegrations(prev => prev.filter(i => i.id !== id));
    router.refresh();
  };

  const handleSync = async (id: string) => {
    setSyncLoading(id);
    try {
      const res = await fetch("/api/admin/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: id }),
      });
      const data = await res.json();
      alert(data.success
        ? `동기화 완료! ${data.recordCount}건 수집됨`
        : `동기화 실패: ${data.error}`);
      router.refresh();
      const listRes = await fetch(`/api/admin/integrations?clientId=${clientId}`);
      if (listRes.ok) setIntegrations(await listRes.json());
    } finally {
      setSyncLoading(null);
    }
  };

  const handleAggregate = async () => {
    setAggregateLoading(true);
    try {
      const res = await fetch("/api/admin/sync-metrics-from-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.success !== false) {
        alert(`성과 지표 반영 완료. 추가 ${data.inserted ?? 0}건, 수정 ${data.updated ?? 0}건`);
        router.refresh();
      } else {
        alert(`반영 실패: ${data.errors?.length ? data.errors.join(", ") : "알 수 없는 오류"}`);
      }
    } catch (e: any) {
      alert(`오류: ${e?.message ?? String(e)}`);
    } finally {
      setAggregateLoading(false);
    }
  };

  const handleMetaSaveFromUrl = async () => {
    if (!metaTokenFromUrl || !metaSaveAdAccountId.trim()) {
      alert("광고 계정 ID를 입력하세요. (예: act_123456789)");
      return;
    }
    setMetaSaveLoading(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          platform: "meta_ads",
          displayName: metaSaveDisplayName.trim() || "Meta 광고",
          credentials: {
            accessToken: metaTokenFromUrl,
            adAccountId: metaSaveAdAccountId.trim().startsWith("act_") ? metaSaveAdAccountId.trim() : `act_${metaSaveAdAccountId.trim()}`,
            tokenExpiresAt: metaExpiresInFromUrl
              ? new Date(Date.now() + Number(metaExpiresInFromUrl) * 1000).toISOString()
              : undefined,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }
      router.replace(`/admin/clients/${clientId}?tab=integrations`, { scroll: false });
      router.refresh();
      const listRes = await fetch(`/api/admin/integrations?clientId=${clientId}`);
      if (listRes.ok) setIntegrations(await listRes.json());
    } catch (e: any) {
      alert(e?.message || "저장 실패");
    } finally {
      setMetaSaveLoading(false);
    }
  };

  const startMetaOAuth = () => {
    const appId = oauthKeys?.metaAppId?.trim() || prompt("Meta App ID를 입력하세요 (또는 위 연동 기본 설정에서 저장):");
    if (!appId) return;
    const base = window.location.origin;
    const redirectUri = `${base}/api/auth/meta/callback`;
    const scope = "ads_read,ads_management";
    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${clientId}&scope=${scope}&response_type=code`;
  };

  const startGoogleOAuth = () => {
    const clientIdVal = oauthKeys?.googleClientId?.trim() || prompt("Google OAuth Client ID를 입력하세요 (또는 위 연동 기본 설정에서 저장):");
    if (!clientIdVal) return;
    const base = window.location.origin;
    const redirectUri = `${base}/api/auth/google/callback`;
    const scope = "https://www.googleapis.com/auth/adwords.readonly https://www.googleapis.com/auth/analytics.readonly";
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientIdVal}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${clientId}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;
  };

  const startLinkedInOAuth = () => {
    window.location.href = `/api/auth/linkedin?clientId=${clientId}`;
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const k of SETTING_KEYS) {
        const v = settingsForm[k]?.trim();
        if (v) payload[k] = v;
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const keysRes = await fetch("/api/admin/oauth-keys");
        if (keysRes.ok) setOauthKeys(await keysRes.json());
        setSettingsOpen(false);
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  const clearOAuthErrorFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    const qs = url.searchParams.toString();
    router.replace(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
  };

  const oauthErrorLabel = errorFromUrl
    ? (errorFromUrl === "access_denied" || errorFromUrl === "user_cancelled"
        ? "사용자가 로그인을 취소했거나 권한을 거부했습니다."
        : (() => { try { return decodeURIComponent(errorFromUrl); } catch { return errorFromUrl; } })())
    : "";

  return (
    <div className="space-y-5">
      {linkedInConnected && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">LinkedIn Ads 연동이 완료되었습니다.</p>
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("linkedin");
                const qs = url.searchParams.toString();
                router.replace(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
              }}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
      {errorFromUrl && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive font-medium">{oauthErrorLabel}</p>
            <Button variant="ghost" size="sm" onClick={clearOAuthErrorFromUrl} className="shrink-0 text-destructive hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">데이터 연동</h3>
          <p className="text-sm text-muted-foreground">외부 광고/분석 플랫폼 연결을 관리합니다</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            자동 동기화: 매일 06:00 (KST) · 수동 동기화는 각 연동 카드의 새로고침 버튼을 사용하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startMetaOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Meta OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={startGoogleOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Google OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={startLinkedInOAuth}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> LinkedIn OAuth
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3.5 w-3.5 mr-1" /> 연동 기본 설정
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 연동 추가
          </Button>
        </div>
      </div>

      {/* 연동 기본 설정 다이얼로그 */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> 연동 기본 설정
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            아래 키값을 저장해 두면 OAuth 시 프롬프트 없이 사용됩니다. .env에 넣어도 되고, 여기 저장해 두면 DB에 보관됩니다 (DB 우선).
          </p>
          <div className="space-y-3 py-2">
            {SETTING_KEYS.map((key) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{SETTING_LABELS[key]}</Label>
                <Input
                  type={key.includes("SECRET") || key === "GOOGLE_DEVELOPER_TOKEN" ? "password" : "text"}
                  value={settingsForm[key] ?? ""}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={adminSettings[key]?.masked ? `현재: ${adminSettings[key].masked}` : "비워두면 .env 사용"}
                  className="font-mono text-xs"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={settingsSaving}>
              {settingsSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 연동 가이드 */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>연동 가이드 — 각 플랫폼 값은 어디서 넣나요?</span>
            </summary>
            <p className="mt-3 text-xs text-muted-foreground border-l-2 border-muted pl-3">
              <strong>원케이션 1세트:</strong> 아래 [연동 기본 설정]에서 키값을 저장해 두면 OAuth 시 프롬프트 없이 사용됩니다.
            </p>
            <div className="mt-3 pl-6 space-y-3 text-xs text-muted-foreground border-l-2 border-muted">
              {(Object.keys(INTEGRATION_GUIDES) as (keyof typeof INTEGRATION_GUIDES)[]).map((key) => {
                const g = INTEGRATION_GUIDES[key];
                if (!g) return null;
                return (
                  <details key={key} className="group/platform">
                    <summary className="cursor-pointer font-medium text-foreground/90">{g.title}</summary>
                    <ul className="mt-1.5 space-y-1 ml-2">
                      {g.steps.map((s, i) => (<li key={i}>{s}</li>))}
                      {g.fields.map((f) => (
                        <li key={f.name}><strong className="text-foreground/80">{f.name}</strong>: {f.where}</li>
                      ))}
                      {g.env && g.env.length > 0 && (
                        <li>필요 env: <code className="bg-muted px-1 rounded">{g.env.join(", ")}</code></li>
                      )}
                    </ul>
                  </details>
                );
              })}
            </div>
          </details>
        </CardContent>
      </Card>

      {metaTokenFromUrl && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium">Meta 인증이 완료되었습니다. 광고 계정 ID를 입력하고 저장하세요.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">표시명</Label>
                <Input value={metaSaveDisplayName} onChange={(e) => setMetaSaveDisplayName(e.target.value)} placeholder="예: Meta 광고" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">광고 계정 ID *</Label>
                <Input value={metaSaveAdAccountId} onChange={(e) => setMetaSaveAdAccountId(e.target.value)} placeholder="act_123456789" />
              </div>
            </div>
            <Button size="sm" onClick={handleMetaSaveFromUrl} disabled={metaSaveLoading}>
              {metaSaveLoading ? "저장 중..." : "연동 저장"}
            </Button>
          </CardContent>
        </Card>
      )}

      {integrations.length === 0 && !metaTokenFromUrl ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Unplug className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>연결된 플랫폼이 없습니다.</p>
          <p className="text-xs mt-1">위 버튼을 눌러 네이버, Meta, Google 등의 광고 플랫폼을 연결하세요.</p>
        </CardContent></Card>
      ) : integrations.length > 0 ? (
        <div className="grid gap-3">
          {integrations.map(integ => (
            <Card key={integ.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{integ.display_name}</span>
                    <Badge variant={integ.status === "active" ? "done" : integ.status === "error" ? "destructive" : "secondary"}>
                      {STATUS_LABEL[integ.status as IntegrationStatus] || integ.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PLATFORM_LABEL[integ.platform] || integ.platform}
                    {integ.last_synced_at && (
                      <span className="ml-2">• 마지막 동기화: {formatDateTime(integ.last_synced_at)}</span>
                    )}
                  </p>
                  {integ.error_message && (
                    <p className="text-xs text-destructive mt-1 truncate">{integ.error_message}</p>
                  )}
                  {integ.platform === "meta_ads" && (() => {
                    const creds = integ.credentials as { tokenExpiresAt?: string } | null;
                    if (!creds?.tokenExpiresAt) return null;
                    const daysLeft = Math.ceil((new Date(creds.tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft > 14) return null;
                    return (
                      <p className={`text-xs mt-1 font-medium ${daysLeft <= 0 ? "text-destructive" : "text-amber-600"}`}>
                        ⚠ Meta 액세스 토큰 {daysLeft <= 0 ? "만료됨 — 재인증 필요" : `${daysLeft}일 후 만료 — 재인증 권장`}
                      </p>
                    );
                  })()}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleSync(integ.id)} disabled={syncLoading === integ.id} title="수동 동기화" aria-label="수동 동기화">
                    <RefreshCw className={`h-4 w-4 ${syncLoading === integ.id ? "animate-spin" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(integ.id)} title="삭제" aria-label="연동 삭제">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* GA4 추적 랜딩페이지 설정 */}
      {integrations.some((i) => i.platform === "google_analytics") && (
        <Card className="mt-4">
          <CardContent className="py-4 space-y-3">
            <div>
              <p className="font-medium text-sm">추적 랜딩페이지 설정</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                GA4 페이지별 지표 수집 시 집중 분석할 URL 경로를 지정합니다. (예: /landing/product-a)
              </p>
            </div>
            {ga4TargetPaths.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ga4TargetPaths.map((path) => (
                  <span key={path} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md font-mono">
                    {path}
                    <button
                      type="button"
                      onClick={() => setGa4TargetPaths((prev) => prev.filter((p) => p !== path))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="경로 삭제"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={ga4PathInput}
                onChange={(e) => setGa4PathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && ga4PathInput.trim()) {
                    e.preventDefault();
                    const p = ga4PathInput.trim();
                    if (!ga4TargetPaths.includes(p)) setGa4TargetPaths((prev) => [...prev, p]);
                    setGa4PathInput("");
                  }
                }}
                placeholder="/landing/product-a"
                className="font-mono text-xs h-8"
              />
              <Button type="button" size="sm" variant="outline" className="h-8 shrink-0"
                onClick={() => {
                  const p = ga4PathInput.trim();
                  if (p && !ga4TargetPaths.includes(p)) setGa4TargetPaths((prev) => [...prev, p]);
                  setGa4PathInput("");
                }}
              >추가</Button>
              <Button type="button" size="sm" className="h-8 shrink-0" disabled={ga4PathsSaving}
                onClick={async () => {
                  setGa4PathsSaving(true);
                  try {
                    const res = await fetch("/api/admin/integrations/ga4-pages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ clientId, paths: ga4TargetPaths }),
                    });
                    if (!res.ok) {
                      const json = await res.json().catch(() => ({}));
                      toast.error(json.error || "저장 실패");
                    } else {
                      toast.success("추적 경로가 저장되었습니다.");
                    }
                  } catch {
                    toast.error("저장 요청 실패");
                  } finally {
                    setGa4PathsSaving(false);
                  }
                }}
              >
                {ga4PathsSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {integrations.length > 0 && (
        <Card className="mt-4">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">성과 지표 자동 반영</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                연동된 플랫폼의 일별 데이터를 주간·월간으로 집계해 성과 지표 탭에 반영합니다.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleAggregate} disabled={aggregateLoading}>
              <BarChart2 className={`h-4 w-4 mr-1 ${aggregateLoading ? "animate-pulse" : ""}`} />
              {aggregateLoading ? "반영 중…" : "성과 지표 반영"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 연동 추가 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>데이터 연동 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>플랫폼</Label>
              <Select value={platform} onValueChange={v => { setPlatform(v as IntegrationPlatform); setTestResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>표시 이름</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="예: 네이버 키워드 광고 - 메인 계정" />
            </div>
            {INTEGRATION_GUIDES[platform] && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">값 넣는 위치</p>
                <ul className="space-y-1 text-muted-foreground">
                  {INTEGRATION_GUIDES[platform].fields.map((f) => (
                    <li key={f.name}><strong>{f.name}</strong>: {f.where}</li>
                  ))}
                </ul>
              </div>
            )}
            {(platform === "naver_ads" || platform === "naver_searchad") && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">네이버 검색광고 API 인증</p>
                <div className="space-y-2"><Label>API Key</Label><Input value={naverApiKey} onChange={e => setNaverApiKey(e.target.value)} placeholder="발급받은 API Key" /></div>
                <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={naverSecretKey} onChange={e => setNaverSecretKey(e.target.value)} placeholder="발급받은 Secret Key" /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={naverCustomerId} onChange={e => setNaverCustomerId(e.target.value)} placeholder="고객 ID (숫자)" /></div>
              </div>
            )}
            {platform === "meta_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Meta Ads 인증</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)} placeholder="OAuth 사용 시 자동" /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={metaAdAccountId} onChange={e => setMetaAdAccountId(e.target.value)} placeholder="act_123456789" /></div>
              </div>
            )}
            {platform === "google_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Ads 인증</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} placeholder="OAuth 리다이렉트 URL에서 복사" /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={googleCustomerId} onChange={e => setGoogleCustomerId(e.target.value)} placeholder="123-456-7890" /></div>
                <div className="space-y-2"><Label>Developer Token (선택)</Label><Input type="password" value={googleDeveloperToken} onChange={e => setGoogleDeveloperToken(e.target.value)} placeholder=".env에 GOOGLE_DEVELOPER_TOKEN 있으면 비워도 됨" /></div>
              </div>
            )}
            {platform === "google_analytics" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Analytics (GA4) 인증</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} placeholder="Google OAuth 후 URL에서 복사" /></div>
                <div className="space-y-2"><Label>Property ID</Label><Input value={ga4PropertyId} onChange={e => setGA4PropertyId(e.target.value)} placeholder="properties/123456789" /></div>
              </div>
            )}
            {platform === "google_search_console" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Google Search Console 인증</p>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={googleRefreshToken} onChange={e => setGoogleRefreshToken(e.target.value)} placeholder="Google OAuth 후 URL에서 복사" /></div>
                <div className="space-y-2"><Label>Site URL</Label><Input value={gscSiteUrl} onChange={e => setGscSiteUrl(e.target.value)} placeholder="https://example.com/ 또는 sc-domain:example.com" /></div>
              </div>
            )}
            {platform === "naver_gfa" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">네이버 GFA 인증</p>
                <div className="space-y-2"><Label>API Key</Label><Input value={naverApiKey} onChange={e => setNaverApiKey(e.target.value)} placeholder="GFA API Key" /></div>
                <div className="space-y-2"><Label>Secret Key</Label><Input type="password" value={naverSecretKey} onChange={e => setNaverSecretKey(e.target.value)} placeholder="GFA Secret Key" /></div>
                <div className="space-y-2"><Label>Customer ID</Label><Input value={naverCustomerId} onChange={e => setNaverCustomerId(e.target.value)} placeholder="고객 ID (숫자)" /></div>
              </div>
            )}
            {platform === "kakao_moment" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">카카오모먼트 인증</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={kakaoAccessToken} onChange={e => setKakaoAccessToken(e.target.value)} placeholder="카카오 비즈니스 → API 설정 → 액세스 토큰" /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={kakaoAdAccountId} onChange={e => setKakaoAdAccountId(e.target.value)} placeholder="광고 계정 ID (숫자)" /></div>
              </div>
            )}
            {platform === "tiktok_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">TikTok Ads 인증</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={tiktokAccessToken} onChange={e => setTiktokAccessToken(e.target.value)} placeholder="TikTok for Developers → Access Token" /></div>
                <div className="space-y-2"><Label>Advertiser ID</Label><Input value={tiktokAdvertiserId} onChange={e => setTiktokAdvertiserId(e.target.value)} placeholder="18자리 숫자" /></div>
              </div>
            )}
            {platform === "shopify" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Shopify 인증</p>
                <div className="space-y-2"><Label>Shop Domain</Label><Input value={shopifyDomain} onChange={e => setShopifyDomain(e.target.value)} placeholder="mystore.myshopify.com" /></div>
                <div className="space-y-2"><Label>Admin API Access Token</Label><Input type="password" value={shopifyAccessToken} onChange={e => setShopifyAccessToken(e.target.value)} placeholder="shpat_xxxx" /></div>
              </div>
            )}
            {platform === "cafe24" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">카페24 인증</p>
                <div className="space-y-2"><Label>Mall ID</Label><Input value={cafe24MallId} onChange={e => setCafe24MallId(e.target.value)} placeholder="mystore" /></div>
                <div className="space-y-2"><Label>Client ID</Label><Input value={cafe24ClientId} onChange={e => setCafe24ClientId(e.target.value)} /></div>
                <div className="space-y-2"><Label>Client Secret</Label><Input type="password" value={cafe24ClientSecret} onChange={e => setCafe24ClientSecret(e.target.value)} /></div>
                <div className="space-y-2"><Label>Refresh Token</Label><Input type="password" value={cafe24RefreshToken} onChange={e => setCafe24RefreshToken(e.target.value)} /></div>
              </div>
            )}
            {platform === "linkedin_ads" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">LinkedIn Ads 인증</p>
                <p className="text-xs text-muted-foreground">권장: 상단 [LinkedIn OAuth] 버튼 클릭 → LinkedIn 로그인 동의 → 광고 계정 자동 연결</p>
                <div className="space-y-2"><Label>Access Token</Label><Input type="password" value={linkedInAccessToken} onChange={e => setLinkedInAccessToken(e.target.value)} placeholder="LinkedIn OAuth 사용 시 자동" /></div>
                <div className="space-y-2"><Label>Ad Account ID</Label><Input value={linkedInAdAccountId} onChange={e => setLinkedInAdAccountId(e.target.value)} placeholder="Campaign Manager → 광고 계정 ID (숫자)" /></div>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <input
                type="checkbox"
                id="autoKpi"
                checked={autoKpi}
                onChange={e => setAutoKpi(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="autoKpi" className="text-sm cursor-pointer">
                <span className="font-medium">KPI 자동 생성</span>
                <span className="text-muted-foreground ml-1.5 text-xs">— 이 플랫폼의 기본 KPI 세트를 자동으로 추가합니다</span>
              </label>
            </div>
            {testResult && <p className="text-sm">{testResult}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={loading}>
              <TestTube2 className="h-3.5 w-3.5 mr-1" /> {loading ? "테스트 중..." : "연결 테스트"}
            </Button>
            <Button onClick={handleAdd} disabled={loading || !displayName}>
              <Zap className="h-3.5 w-3.5 mr-1" /> {loading ? "저장 중..." : "연동 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
