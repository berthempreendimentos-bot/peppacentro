import type { Metadata } from "next";

import { LancamentosGlobaisTable } from "@/components/financeiro/lancamentos-globais-table";

export const metadata: Metadata = {
  title: "Financeiro | PEPACORP CENTRO",
};

export default function FinanceiroPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="text-muted-foreground">
          Visão consolidada dos lançamentos de todos os contratos.
        </p>
      </div>
      <LancamentosGlobaisTable />
    </div>
  );
}
