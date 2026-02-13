import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { Footer } from "@/components/layout/footer";
import { MobileSidebarWrapper } from "@/components/layout/mobile-sidebar-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <MobileSidebarWrapper sidebar={<AdminSidebar />} footer={<Footer />}>
      <div className="flex min-h-screen flex-col">
        <AdminHeader displayName={session.profile.display_name} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </MobileSidebarWrapper>
  );
}
