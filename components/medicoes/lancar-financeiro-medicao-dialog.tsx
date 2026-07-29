"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useCreateLancamento } from "@/lib/queries/lancamentos"
import type { Medicao } from "@/lib/queries/medicoes"
import { useContrato } from "@/lib/queries/contratos"
import { useFuncionarios } from "@/lib/queries/funcionarios"
import { calcularContaDepositoVinculada, somarTotais } from "@/lib/calculo-folha"
import { useTributos } from "@/hooks/use-tributos"
import { calcularResumoMedicao } from "@/lib/calculo-medicao"
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
  const { data: contrato } = useContrato(contratoId)
  const { data: funcionarios } = useFuncionarios(contratoId)
  const { taxas } = useTributos()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!medicao) return null

  // Recalcula ao vivo (mesma fórmula do espelho: Valor dos Serviços menos as
  // deduções) em vez de confiar só no valor_liquido gravado, para funcionar
  // corretamente também em medições criadas antes desse campo existir.
  const resumo = calcularResumoMedicao({
    maoDeObra: medicao.mao_de_obra,
    valeTransporte: medicao.vale_transporte,
    valeRefeicao: medicao.vale_refeicao,
    material: medicao.material,
    issAliquota: contrato?.iss_aliquota ?? 5,
  })
  const valorReceber = resumo.valorLiquido

  // Líquido dos empregados/FGTS/Valor Vinculado gravados na medição podem
  // estar zerados em medições criadas antes desses campos existirem —
  // nesse caso, recalcula ao vivo da Folha de Pagamento atual como fallback.
  const temSnapshot = medicao.liquido_empregados > 0 || medicao.fgts > 0 || medicao.valor_vinculado > 0
  const totaisFolha = somarTotais(funcionarios ?? [], taxas)
  const liquidoEmpregados = temSnapshot ? medicao.liquido_empregados : totaisFolha.liquido
  const fgts = temSnapshot ? medicao.fgts : totaisFolha.fgts
  const valorVinculado = temSnapshot
    ? medicao.valor_vinculado
    : calcularContaDepositoVinculada(totaisFolha.remuneracaoTotal).totalRetencaoMensal

  const valorPagar = liquidoEmpregados + fgts + valorVinculado

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
          descricao: `Medição nº ${medicao.numero} — Folha + FGTS + Vinculado`,
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
            descricao="Líquido dos empregados + FGTS + Valor Vinculado"
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
