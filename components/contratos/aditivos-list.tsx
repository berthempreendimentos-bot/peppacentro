"use client"

import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useAditivos, useDeleteAditivo } from "@/lib/queries/aditivos"
import { formatCurrencyBRL, formatDate } from "@/lib/format"
import { AditivoFormDialog } from "@/components/contratos/aditivo-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AditivosList({ contratoId }: { contratoId: string }) {
  const { data: aditivos, isLoading } = useAditivos(contratoId)
  const deleteAditivo = useDeleteAditivo(contratoId)

  async function handleDelete(id: string) {
    try {
      await deleteAditivo.mutateAsync(id)
      toast.success("Aditivo removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover aditivo")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AditivoFormDialog
          contratoId={contratoId}
          trigger={
            <Button>
              <Plus /> Novo Aditivo
            </Button>
          }
        />
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}

      {!isLoading && aditivos?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum aditivo registrado para este contrato.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {aditivos?.map((aditivo) => (
          <Card key={aditivo.id}>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDate(aditivo.created_at)}</span>
                  {aditivo.prazo_dias ? <span>· +{aditivo.prazo_dias} dias</span> : null}
                  {aditivo.novo_valor ? (
                    <span>· Novo valor: {formatCurrencyBRL(aditivo.novo_valor)}</span>
                  ) : null}
                </div>
                {aditivo.objeto && <p className="font-medium">{aditivo.objeto}</p>}
                <p className="text-sm text-muted-foreground">{aditivo.justificativa}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(aditivo.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
