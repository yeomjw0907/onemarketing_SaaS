import type { Metadata } from "next";
import { requireClient, isModuleEnabled } from "@/lib/auth";
import { ModuleDisabled } from "@/components/module-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "문의하기 | Onecation",
  description: "카카오톡 상담 및 공지사항",
};

export default async function SupportPage() {
  const session = await requireClient();
  if (!isModuleEnabled(session.client?.enabled_modules, "support")) {
    return <ModuleDisabled />;
  }

  const kakaoUrl = session.client?.kakao_chat_url;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" /> 문의하기
        </h1>
        <p className="text-muted-foreground text-sm mt-1">도움이 필요하신가요?</p>
      </div>

      {/* 카카오톡 상담 — 전체 폭 한 줄 카드 */}
      <Card className="w-full">
        <CardContent className="py-5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-[#FEE500]/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-[#191919]" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">카카오톡 상담</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  담당 매니저에게 카카오톡으로 바로 문의하세요.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              {kakaoUrl ? (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href={kakaoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    카카오톡 상담하기
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  카카오톡 상담 링크가 설정되지 않았습니다.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
