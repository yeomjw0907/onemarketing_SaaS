import { requireClient, isModuleEnabled } from "@/lib/auth";
import { ModuleDisabled } from "@/components/module-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, Bell } from "lucide-react";

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
          <MessageCircle className="h-6 w-6" /> Support
        </h1>
        <p className="text-muted-foreground text-sm mt-1">도움이 필요하신가요?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Kakao Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-5 w-5" /> 카카오톡 상담
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              담당 매니저에게 카카오톡으로 바로 문의하세요.
            </p>
            {kakaoUrl ? (
              <Button asChild>
                <a href={kakaoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  카카오톡 상담하기
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                카카오톡 상담 링크가 설정되지 않았습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notices placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5" /> 공지사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">아직 등록된 공지사항이 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
