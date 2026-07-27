import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { ContratosTable } from "@/components/contratos/contratos-table";
import { ContratoFormDialog } from "@/components/contratos/contrato-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contratos | PEPACORP CENTRO",
};

export default function ContratosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contratos</h1>
          <p className="text-muted-foreground">
            Contratos cadastrados, valores e situação atual.
          </p>
        </div>
        <ContratoFormDialog
          trigger={
            <Button>
              <Plus /> Novo Contrato
            </Button>
          }
        />
      </div>
      <ContratosTable />
    </div>
  );
}
