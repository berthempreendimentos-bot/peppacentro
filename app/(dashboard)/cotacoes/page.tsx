import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { CotacoesTable } from "@/components/cotacoes/cotacoes-table";
import { CotacaoFormDialog } from "@/components/cotacoes/cotacao-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cotações | PEPACORP CENTRO",
};

export default function CotacoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cotações</h1>
          <p className="text-muted-foreground">
            Compare preços de empresas por produto ou serviço para decidir a
            melhor opção de compra.
          </p>
        </div>
        <CotacaoFormDialog
          trigger={
            <Button>
              <Plus /> Nova Cotação
            </Button>
          }
        />
      </div>
      <CotacoesTable />
    </div>
  );
}
