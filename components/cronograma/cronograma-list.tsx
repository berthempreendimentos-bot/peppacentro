"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useCronograma, useDeleteEtapa } from "@/lib/queries/cronograma"
import { cronogramaEtapaOptions, cronogramaStatusOptions } from "@/lib/validations/cronograma"
import { formatDate } from "@/lib/format"
import { EtapaFormDialog } from "@/components/cronograma/etapa-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const etapaLabel = Object.fromEntries(cronogramaEtapaOptions.map((o) => [o.value, o.label]))
const statusLabel = Object.fromEntries(cronogramaStatusOptions.map((o) => [o.value, o.label]))
const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  pendente: "outline",
  em_andamento: "default",
  concluido: "secondary",
  atrasado: "destructive",
}

export function CronogramaList({ contratoId }: { contratoId: string }) {
  const { data: etapas, isLoading } = useCronograma(contratoId)
  const deleteEtapa = useDeleteEtapa(contratoId)

  const progressoGeral =
    etapas && etapas.length > 0
      ? Math.round(etapas.reduce((acc, e) => acc + e.percentual, 0) / etapas.length)
      : 0

  async function handleDelete(id: string) {
    try {
      await deleteEtapa.mutateAsync(id)
      toast.success("Etapa removida")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover etapa")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Andamento geral do contrato</p>
            <p className="font-semibold">{progressoGeral}%</p>
          </div>
          <Progress value={progressoGeral} className="mt-2" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <EtapaFormDialog
          contratoId={contratoId}
          trigger={
            <Button>
              <Plus /> Nova Etapa
            </Button>
          }
        />
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}
      {!isLoading && etapas?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Nenhuma etapa cadastrada para este contrato.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {etapas?.map((etapa) => (
          <Card key={etapa.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{etapaLabel[etapa.etapa]}</span>
                    <Badge variant={statusVariant[etapa.status]}>
                      {statusLabel[etapa.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(etapa.data_inicial)} — {formatDate(etapa.data_final)}
                    {etapa.usuarios?.nome ? ` · ${etapa.usuarios.nome}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <EtapaFormDialog
                    contratoId={contratoId}
                    etapa={etapa}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(etapa.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={etapa.percentual} className="flex-1" />
                <span className="w-10 text-right text-sm text-muted-foreground">
                  {etapa.percentual}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
