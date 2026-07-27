import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EmpresasTable } from "@/components/configuracoes/empresas-table";
import { EmpresaFormDialog } from "@/components/configuracoes/empresa-form-dialog";
import { UsuariosTable } from "@/components/configuracoes/usuarios-table";
import { UsuarioFormDialog } from "@/components/configuracoes/usuario-form-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Configurações | PEPACORP CENTRO",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">
          Painel master: gerencie as empresas próprias e os usuários do sistema.
        </p>
      </div>

      <Tabs defaultValue="empresas">
        <TabsList>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="empresas" className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <EmpresaFormDialog
              trigger={
                <Button>
                  <Plus /> Nova Empresa
                </Button>
              }
            />
          </div>
          <EmpresasTable />
        </TabsContent>
        <TabsContent value="usuarios" className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <UsuarioFormDialog
              trigger={
                <Button>
                  <Plus /> Novo Usuário
                </Button>
              }
            />
          </div>
          <UsuariosTable usuarioAtualId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
