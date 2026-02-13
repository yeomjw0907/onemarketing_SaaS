import { requireClient } from "@/lib/auth";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { ClientHeader } from "@/components/layout/client-header";
import { Footer } from "@/components/layout/footer";
import { MobileSidebarWrapper } from "@/components/layout/mobile-sidebar-wrapper";
import { EnabledModules } from "@/lib/types/database";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireClient();
  const enabledModules: EnabledModules = session.client?.enabled_modules || {
    overview: true,
    execution: true,
    calendar: true,
    projects: true,
    reports: true,
    assets: true,
    support: true,
  };

  return (
    <MobileSidebarWrapper
      sidebar={
        <ClientSidebar
          enabledModules={enabledModules}
          clientName={session.client?.name || "Client"}
        />
      }
      footer={<Footer />}
    >
      <div className="flex min-h-screen flex-col">
        <ClientHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </MobileSidebarWrapper>
  );
}
