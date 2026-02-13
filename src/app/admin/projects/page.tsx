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
    .limit(200);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">프로젝트 (전체)</h1>
        <p className="text-muted-foreground text-sm mt-1">모든 클라이언트의 프로젝트를 모아봅니다.</p>
      </div>
      <ProjectsAdmin initialProjects={projects || []} clients={clients || []} />
    </div>
  );
}
