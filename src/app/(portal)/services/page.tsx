import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { ServiceCatalogView } from "@/components/service-catalog-view";

export const metadata: Metadata = {
  title: "서비스 | Onecation",
  description: "이용 중인 서비스 바로가기 및 추가 가능한 서비스",
};

export default async function ServicesPage() {
  const session = await requireClient();
  const enabledServices = (session.client?.enabled_services || {}) as Record<string, boolean>;
  const serviceUrls = (session.client?.service_urls || {}) as Record<string, string>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">서비스</h1>
        <p className="text-sm text-muted-foreground mt-1">
          이용 중인 서비스 채널로 바로 이동하고, 추가 가능한 서비스를 확인할 수 있습니다.
        </p>
      </div>

      <ServiceCatalogView
        enabledServices={enabledServices}
        serviceUrls={serviceUrls}
      />
    </div>
  );
}
