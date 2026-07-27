import type { Metadata } from "next";

import { DocumentosGlobaisTable } from "@/components/documentos/documentos-globais-table";

export const metadata: Metadata = {
  title: "Documentos | PEPACORP CENTRO",
};

export default function DocumentosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="text-muted-foreground">
          Todos os documentos enviados, organizados por contrato. Para enviar, acesse
          a aba Documentos dentro de cada contrato.
        </p>
      </div>
      <DocumentosGlobaisTable />
    </div>
  );
}
