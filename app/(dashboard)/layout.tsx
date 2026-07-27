import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nome, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar
          nome={perfil?.nome ?? ""}
          email={user.email ?? ""}
          role={perfil?.role ?? "visualizador"}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
