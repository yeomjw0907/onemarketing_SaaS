import { requireClient } from "@/lib/auth";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { ClientHeader } from "@/components/layout/client-header";
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
    <div className="min-h-screen bg-background">
      <ClientSidebar
        enabledModules={enabledModules}
        clientName={session.client?.name || "Client"}
      />
      <div className="ml-60">
        <ClientHeader displayName={session.profile.display_name} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
