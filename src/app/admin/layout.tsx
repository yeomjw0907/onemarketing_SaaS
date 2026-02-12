import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-60">
        <AdminHeader displayName={session.profile.display_name} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
