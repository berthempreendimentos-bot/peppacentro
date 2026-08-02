"use client"

import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"

import { useContratos } from "@/lib/queries/contratos"
import { useMedicoesGlobal } from "@/lib/queries/medicoes"
import { useLancamentosGlobal } from "@/lib/queries/lancamentos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrencyBRL } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"

function formatMesReferencia(yyyyMM: string) {
  if (!yyyyMM) return ""
  const [ano, mes] = yyyyMM.split("-")
  const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
  return `${meses[parseInt(mes, 10) - 1]}/${ano}`
}

export function ResumoFinanceiroDialog() {
  const { data: contratos, isLoading: isLoadingContratos } = useContratos()
  const { data: medicoes, isLoading: isLoadingMedicoes } = useMedicoesGlobal()
  const { data: lancamentos, isLoading: isLoadingLancamentos } = useLancamentosGlobal()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedContratos, setSelectedContratos] = useState<string[]>([])
  const [selectedMes, setSelectedMes] = useState<string>("")
  const [gerouResumo, setGerouResumo] = useState(false)

  const contratosEmAndamento = useMemo(() => {
    return (contratos || []).filter((c) => c.situacao === "em_andamento")
  }, [contratos])

  const mesesDisponiveis = useMemo(() => {
    if (!medicoes && !lancamentos) return []
    const mSet = new Set<string>()
    lancamentos?.forEach((l) => {
      if (l.mes_referencia) mSet.add(l.mes_referencia)
      else if (l.data) mSet.add(l.data.substring(0, 7))
    })
    medicoes?.forEach((m) => {
      if (m.competencia) mSet.add(m.competencia)
    })
    return Array.from(mSet).sort((a, b) => b.localeCompare(a))
  }, [lancamentos, medicoes])

  const handleToggleContrato = (id: string, checked: boolean) => {
    setGerouResumo(false)
    if (checked) {
      setSelectedContratos((prev) => [...prev, id])
    } else {
      setSelectedContratos((prev) => prev.filter((c) => c !== id))
    }
  }

  const handleToggleAll = (checked: boolean) => {
    setGerouResumo(false)
    if (checked) {
      setSelectedContratos(contratosEmAndamento.map(c => c.id))
    } else {
      setSelectedContratos([])
    }
  }

  const isLoading = isLoadingContratos || isLoadingMedicoes || isLoadingLancamentos

  const resumo = useMemo(() => {
    if (!gerouResumo || selectedContratos.length === 0 || !selectedMes) return null

    // Filtrar Medições
    const medicoesMes = (medicoes || []).filter(
      (m) => m.competencia === selectedMes && m.contrato_id && selectedContratos.includes(m.contrato_id)
    )

    // Filtrar Lançamentos
    const lancamentosMes = (lancamentos || []).filter(
      (l) => {
        const mes = l.mes_referencia || l.data.substring(0, 7)
        return mes === selectedMes && l.contrato_id && selectedContratos.includes(l.contrato_id)
      }
    )

    const valorMedicao = medicoesMes.reduce((acc, m) => acc + (m.valor || 0), 0)
    const valorRetencao = medicoesMes.reduce((acc, m) => acc + (m.valor_vinculado || 0), 0)
    const valorLiquido = medicoesMes.reduce((acc, m) => acc + (m.valor_liquido || 0), 0)

    const ENTRADAS = new Set(["receita", "recebimento"])
    
    // Total Gastos = Lançamentos que não são ENTRADAS nem Medição (como é filtrado? "despesa" e "pagamento")
    const totalGastos = lancamentosMes
      .filter((l) => !ENTRADAS.has(l.tipo) && l.tipo !== "medicao")
      .reduce((acc, l) => acc + l.valor, 0)
      
    // Pagamento do Contrato = Lançamentos que são ENTRADAS
    const pagamentoContrato = lancamentosMes
      .filter((l) => ENTRADAS.has(l.tipo))
      .reduce((acc, l) => acc + l.valor, 0)

    return {
      valorMedicao,
      valorRetencao,
      valorLiquido,
      totalGastos,
      pagamentoContrato,
    }
  }, [gerouResumo, selectedContratos, selectedMes, medicoes, lancamentos])

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      setIsOpen(val)
      if (!val) {
        setGerouResumo(false)
        setSelectedContratos([])
        setSelectedMes("")
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto shrink-0">
          <Calculator className="mr-2 size-4" /> Resumo Financeiro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumo Financeiro</DialogTitle>
          <DialogDescription>
            Selecione os contratos e o mês para gerar o relatório consolidado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-base">Mês de Referência</Label>
              <Select
                value={selectedMes}
                onValueChange={(val) => {
                  setSelectedMes(val)
                  setGerouResumo(false)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um mês" />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatMesReferencia(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">Contratos em Andamento</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all" 
                    checked={selectedContratos.length === contratosEmAndamento.length && contratosEmAndamento.length > 0}
                    onCheckedChange={(checked) => handleToggleAll(checked as boolean)}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer text-sm">
                    Selecionar Todos
                  </Label>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border p-4 space-y-3">
                {contratosEmAndamento.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum contrato em andamento encontrado.</p>
                )}
                {contratosEmAndamento.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`c-${c.id}`}
                      checked={selectedContratos.includes(c.id)}
                      onCheckedChange={(checked) => handleToggleContrato(c.id, checked as boolean)}
                    />
                    <Label htmlFor={`c-${c.id}`} className="cursor-pointer text-sm font-medium leading-none">
                      {c.numero} - {c.clientes?.nome}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={selectedContratos.length === 0 || !selectedMes}
              onClick={() => setGerouResumo(true)}
            >
              Gerar Resumo
            </Button>

            {resumo && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-2">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Valor da Medição</p>
                    <p className="text-xl font-semibold">{formatCurrencyBRL(resumo.valorMedicao)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Valor da Retenção</p>
                    <p className="text-xl font-semibold">{formatCurrencyBRL(resumo.valorRetencao)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Valor Líquido</p>
                    <p className="text-xl font-semibold text-primary">{formatCurrencyBRL(resumo.valorLiquido)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total de Gastos (Despesas)</p>
                    <p className="text-xl font-semibold text-destructive">{formatCurrencyBRL(resumo.totalGastos)}</p>
                  </CardContent>
                </Card>
                <Card className="sm:col-span-2">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pagamento do Contrato (Recebimentos)</p>
                    <p className="text-xl font-semibold text-green-600">{formatCurrencyBRL(resumo.pagamentoContrato)}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
