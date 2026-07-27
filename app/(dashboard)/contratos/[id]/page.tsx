"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { useContrato } from "@/lib/queries/contratos";
import { useLancamentos } from "@/lib/queries/lancamentos";
import { ContratoFormDialog } from "@/components/contratos/contrato-form-dialog";
import { ContratoDados } from "@/components/contratos/contrato-dados";
import { AditivosList } from "@/components/contratos/aditivos-list";
import { LancamentosTable } from "@/components/financeiro/lancamentos-table";
import { CronogramaList } from "@/components/cronograma/cronograma-list";
import { MedicoesList } from "@/components/medicoes/medicoes-list";
import { DocumentosTable } from "@/components/documentos/documentos-table";
import { PlanilhaCustoTab } from "@/components/planilha-custo/planilha-custo-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const situacaoLabel: Record<string, string> = {
  em_andamento: "Em andamento",
  executado: "Executado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  inicializacao: "Inicialização",
};

const abasValidas = [
  "dados",
  "aditivos",
  "cronograma",
  "financeiro",
  "planilha-custo",
  "medicoes",
  "documentos",
];

export default function ContratoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: contrato, isLoading } = useContrato(params.id);
  const { data: lancamentos } = useLancamentos(params.id);

  const abaParam = searchParams.get("tab");
  const abaInicial = abaParam && abasValidas.includes(abaParam) ? abaParam : "dados";

  const totalReceitas = (lancamentos ?? [])
    .filter((l) => l.tipo === "receita" || l.tipo === "recebimento")
    .reduce((acc, l) => acc + l.valor, 0);
  const totalDespesas = (lancamentos ?? [])
    .filter((l) => l.tipo !== "receita" && l.tipo !== "recebimento")
    .reduce((acc, l) => acc + l.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const percentualSaude = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : null;

  if (isLoading || !contrato) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 -mb-2 w-fit"
        onClick={() => router.push("/contratos")}
      >
        <ArrowLeft className="size-4" /> Contratos
      </Button>

      <Card className="accent-bar">
        <CardContent className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="label-caps text-muted-foreground">
              Contrato #{contrato.numero}
            </span>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">{contrato.numero}</h1>
              <Badge>{situacaoLabel[contrato.situacao]}</Badge>
              {percentualSaude !== null && (
                <Badge
                  variant={percentualSaude >= 0 ? "default" : "destructive"}
                  className={percentualSaude >= 0 ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  Saúde: {percentualSaude > 0 ? "+" : ""}
                  {percentualSaude.toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{contrato.clientes?.nome}</p>
          </div>
          <ContratoFormDialog
            contrato={contrato}
            trigger={
              <Button variant="outline">
                <Pencil /> Editar
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Tabs defaultValue={abaInicial}>
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="aditivos">Aditivos</TabsTrigger>
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="planilha-custo">Planilha de Custo</TabsTrigger>
          <TabsTrigger value="medicoes">Medições</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="dados">
          <ContratoDados contrato={contrato} />
        </TabsContent>
        <TabsContent value="aditivos">
          <AditivosList contratoId={contrato.id} />
        </TabsContent>
        <TabsContent value="cronograma">
          <CronogramaList contratoId={contrato.id} />
        </TabsContent>
        <TabsContent value="financeiro">
          <LancamentosTable contratoId={contrato.id} />
        </TabsContent>
        <TabsContent value="planilha-custo">
          <PlanilhaCustoTab contratoId={contrato.id} />
        </TabsContent>
        <TabsContent value="medicoes">
          <MedicoesList contratoId={contrato.id} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentosTable contratoId={contrato.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
