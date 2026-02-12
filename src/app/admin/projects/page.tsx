import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProjectsAdmin } from "./projects-admin";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">프로젝트를 관리합니다.</p>
      </div>
      <ProjectsAdmin initialProjects={projects || []} clients={clients || []} />
    </div>
  );
}
