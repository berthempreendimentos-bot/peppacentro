"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { useCotacao } from "@/lib/queries/cotacoes";
import { cotacaoStatusOptions } from "@/lib/validations/cotacoes";
import { CotacaoFormDialog } from "@/components/cotacoes/cotacao-form-dialog";
import { CotacaoComparativo } from "@/components/cotacoes/cotacao-comparativo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabel = Object.fromEntries(cotacaoStatusOptions.map((o) => [o.value, o.label]));
const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  aberta: "default",
  fechada: "secondary",
  cancelada: "destructive",
};

export default function CotacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: cotacao, isLoading } = useCotacao(params.id);

  if (isLoading || !cotacao) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 -mb-2 w-fit"
        onClick={() => router.push("/cotacoes")}
      >
        <ArrowLeft className="size-4" /> Cotações
      </Button>

      <Card className="accent-bar">
        <CardContent className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="label-caps text-muted-foreground">
              {cotacao.contratos
                ? `Contrato ${cotacao.contratos.numero} · ${cotacao.contratos.clientes?.nome ?? ""}`
                : "Sem contrato vinculado"}
            </span>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">{cotacao.titulo}</h1>
              <Badge variant={statusVariant[cotacao.status]}>
                {statusLabel[cotacao.status]}
              </Badge>
            </div>
            {cotacao.descricao && (
              <p className="text-muted-foreground">{cotacao.descricao}</p>
            )}
          </div>
          <CotacaoFormDialog
            cotacao={cotacao}
            trigger={
              <Button variant="outline">
                <Pencil /> Editar
              </Button>
            }
          />
        </CardContent>
      </Card>

      <CotacaoComparativo cotacao={cotacao} />
    </div>
  );
}
