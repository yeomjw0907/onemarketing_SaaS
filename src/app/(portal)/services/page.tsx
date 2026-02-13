import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { SERVICE_CATALOG } from "@/lib/service-catalog";
import { ServiceIcon } from "@/components/service-icon";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "서비스 | Onecation",
  description: "이용 중인 서비스 바로가기",
};

export default async function ServicesPage() {
  const session = await requireClient();
  const enabledServices = (session.client?.enabled_services || {}) as Record<string, boolean>;
  const serviceUrls = (session.client?.service_urls || {}) as Record<string, string>;

  const allItems = SERVICE_CATALOG.flatMap((cat) => cat.items);
  const activeItems = allItems.filter((item) => enabledServices[item.key] === true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">서비스</h1>
        <p className="text-sm text-muted-foreground mt-1">
          이용 중인 서비스 채널로 바로 이동할 수 있습니다.
        </p>
      </div>

      {activeItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-12 text-center text-muted-foreground">
          <p className="font-medium">이용 중인 서비스가 없습니다.</p>
          <p className="text-sm mt-1">개요 페이지에서 서비스 항목을 확인해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeItems.map((item) => {
            const linkUrl = serviceUrls[item.key]?.trim();
            const CardWrapper = linkUrl ? "a" : "div";
            const cardProps = linkUrl
              ? { href: linkUrl, target: "_blank", rel: "noopener noreferrer" }
              : {};
            return (
              <CardWrapper
                key={item.key}
                {...cardProps}
                className={`flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-sm transition-all ${
                  linkUrl ? "hover:border-primary/40 hover:shadow-md cursor-pointer" : ""
                }`}
              >
                <ServiceIcon iconKey={item.iconKey} color={item.color} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                </div>
                {linkUrl ? (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    바로가기 <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">링크 미설정</span>
                )}
              </CardWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
