import type { Metadata } from "next";

import { MedicoesGlobaisTable } from "@/components/medicoes/medicoes-globais-table";

export const metadata: Metadata = {
  title: "Medições | PEPACORP CENTRO",
};

export default function MedicoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Medições</h1>
        <p className="text-muted-foreground">
          Visão consolidada das medições de todos os contratos. Para lançar, acesse a
          aba Medições dentro de cada contrato.
        </p>
      </div>
      <MedicoesGlobaisTable />
    </div>
  );
}
