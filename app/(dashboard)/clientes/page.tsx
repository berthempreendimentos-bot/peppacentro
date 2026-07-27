import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { ClientesTable } from "@/components/clientes/clientes-table";
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Clientes | PEPACORP CENTRO",
};

export default function ClientesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground">
            Cadastro de clientes pessoa física e jurídica.
          </p>
        </div>
        <ClienteFormDialog
          trigger={
            <Button>
              <Plus /> Novo Cliente
            </Button>
          }
        />
      </div>
      <ClientesTable />
    </div>
  );
}
