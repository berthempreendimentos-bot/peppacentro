import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { FornecedoresTable } from "@/components/fornecedores/fornecedores-table";
import { FornecedorFormDialog } from "@/components/fornecedores/fornecedor-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Fornecedores | PEPACORP CENTRO",
};

export default function FornecedoresPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fornecedores</h1>
          <p className="text-muted-foreground">
            Cadastro de fornecedores e prestadores de serviço.
          </p>
        </div>
        <FornecedorFormDialog
          trigger={
            <Button>
              <Plus /> Novo Fornecedor
            </Button>
          }
        />
      </div>
      <FornecedoresTable />
    </div>
  );
}
