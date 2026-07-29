"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useCreateLancamento } from "@/lib/queries/lancamentos"
import type { Medicao } from "@/lib/queries/medicoes"
import { formatCurrencyBRL } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function LinhaValor({
  titulo,
  descricao,
  valor,
}: {
  titulo: string
  descricao: string
  valor: number
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="label-caps text-muted-foreground">{titulo}</p>
      <p className="text-sm text-muted-foreground">{descricao}</p>
      <p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(valor)}</p>
    </div>
  )
}

export function LancarFinanceiroMedicaoDialog({
  medicao,
  contratoId,
  open,
  onOpenChange,
}: {
  medicao: Medicao | null
  contratoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createLancamento = useCreateLancamento(contratoId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!medicao) return null

  const valorReceber = medicao.valor_liquido
  const valorPagar =
    medicao.liquido_empregados +
    medicao.fgts +
    medicao.vale_transporte +
    medicao.vale_refeicao +
    medicao.valor_vinculado

  async function handleConfirmar() {
    if (!medicao) return
    setIsSubmitting(true)
    try {
      const dataLancamento = medicao.data || medicao.competencia
      await createLancamento.mutateAsync({
        input: {
          tipo: "receita",
          descricao: `Medição nº ${medicao.numero} — Nota Fiscal`,
          valor: valorReceber,
          data: dataLancamento,
          mes_referencia: medicao.competencia.slice(0, 7),
          status: "pendente",
        },
      })
      await createLancamento.mutateAsync({
        input: {
          tipo: "despesa",
          descricao: `Medição nº ${medicao.numero} — Folha + FGTS + VT + VA + Vinculado`,
          valor: valorPagar,
          data: dataLancamento,
          mes_referencia: medicao.competencia.slice(0, 7),
          status: "pendente",
        },
      })
      toast.success("Lançamentos criados em Contas a Receber e Contas a Pagar")
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível criar os lançamentos"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar medição no financeiro</DialogTitle>
          <DialogDescription>
            Cria dois lançamentos referentes à Medição nº {medicao.numero}: uma nota em Contas a
            Receber e um lançamento em Contas a Pagar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <LinhaValor
            titulo="Contas a Receber"
            descricao="Nota fiscal — Valor Total do espelho de medição"
            valor={valorReceber}
          />
          <LinhaValor
            titulo="Contas a Pagar"
            descricao="Líquido dos empregados + FGTS + Vale Transporte + Vale Alimentação + Valor Vinculado"
            valor={valorPagar}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={isSubmitting}>
            {isSubmitting ? "Lançando..." : "Confirmar lançamentos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
