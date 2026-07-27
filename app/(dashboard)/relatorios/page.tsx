import type { Metadata } from "next";
import { FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Relatórios | PEPACORP CENTRO",
};

const reports = [
  {
    key: "contratos",
    title: "Contratos",
    description: "Número, cliente, situação, valores e data de encerramento.",
  },
  {
    key: "financeiro",
    title: "Financeiro",
    description: "Lançamentos de todos os contratos com totais de receitas e despesas.",
  },
] as const;

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-muted-foreground">
          Exporte os dados do sistema em PDF ou Excel.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.key}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={`/api/reports/excel?tipo=${report.key}`}>
                  <FileSpreadsheet /> Excel
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/reports/pdf?tipo=${report.key}`}>
                  <FileText /> PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
