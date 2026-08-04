"use client"

import { useMemo, useState } from "react"
import { Calculator, Download, TrendingUp, TrendingDown, Wallet, FileText, Briefcase } from "lucide-react"

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
      if (l.mes_referencia) mSet.add(l.mes_referencia.substring(0, 7))
      else if (l.data) mSet.add(l.data.substring(0, 7))
    })
    medicoes?.forEach((m) => {
      if (m.competencia) mSet.add(m.competencia.substring(0, 7))
    })
    return Array.from(mSet).sort((a, b) => b.localeCompare(a))
  }, [lancamentos, medicoes])

  const contratosDisponiveis = useMemo(() => {
    if (!selectedMes) return []
    return contratosEmAndamento.filter((c) => {
      return (medicoes || []).some(
        (m) => m.contrato_id === c.id && m.competencia?.substring(0, 7) === selectedMes
      )
    })
  }, [contratosEmAndamento, medicoes, selectedMes])

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
      setSelectedContratos(contratosDisponiveis.map(c => c.id))
    } else {
      setSelectedContratos([])
    }
  }

  const isLoading = isLoadingContratos || isLoadingMedicoes || isLoadingLancamentos

  const resumo = useMemo(() => {
    if (!gerouResumo || selectedContratos.length === 0 || !selectedMes) return null

    // Filtrar Medições
    const medicoesMes = (medicoes || []).filter(
      (m) => m.competencia?.substring(0, 7) === selectedMes && m.contrato_id && selectedContratos.includes(m.contrato_id)
    )

    // Filtrar Lançamentos
    const lancamentosMes = (lancamentos || []).filter(
      (l) => {
        const mes = (l.mes_referencia || l.data).substring(0, 7)
        return mes === selectedMes && l.contrato_id && selectedContratos.includes(l.contrato_id)
      }
    )

    const valorMedicao = medicoesMes.reduce((acc, m) => acc + (m.valor || 0), 0)
    const valorRetencao = medicoesMes.reduce((acc, m) => acc + ((m.valor || 0) - (m.valor_liquido || 0)), 0)
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
      <DialogContent className="sm:max-w-5xl max-w-[95vw] overflow-y-auto max-h-[95vh]">
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
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Coluna Esquerda: Formulário */}
            <div className="flex flex-col gap-6 w-full xl:w-1/3">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Label className="text-base font-semibold leading-tight">Contratos Disponíveis</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all" 
                    checked={selectedContratos.length === contratosDisponiveis.length && contratosDisponiveis.length > 0}
                    onCheckedChange={(checked) => handleToggleAll(checked as boolean)}
                    disabled={contratosDisponiveis.length === 0}
                  />
                  <Label htmlFor="select-all" className={`cursor-pointer text-sm ${contratosDisponiveis.length === 0 ? "opacity-50" : ""}`}>
                    Selecionar Todos
                  </Label>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border p-4 space-y-3">
                {!selectedMes ? (
                  <p className="text-sm text-muted-foreground">Selecione um mês acima para ver os contratos disponíveis.</p>
                ) : contratosDisponiveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma medição encontrada para o mês selecionado.</p>
                ) : (
                  contratosDisponiveis.map((c) => (
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
                  ))
                )}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={selectedContratos.length === 0 || !selectedMes}
              onClick={() => setGerouResumo(true)}
            >
              Gerar Resumo
            </Button>
            </div>

            {/* Coluna Direita: Resultados */}

            {resumo && (
              <div className="flex flex-col gap-3 w-full xl:w-2/3">
                {/* Header com botão PDF */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Resumo Gerado com Sucesso</span>
                  </div>
                  <Button asChild size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    <a href={`/api/financeiro/resumo-pdf?mes=${selectedMes}&contratos=${selectedContratos.join(",")}`} target="_blank" rel="noreferrer">
                      <Download className="size-4" /> Baixar PDF
                    </a>
                  </Button>
                </div>

                {/* Valor Líquido em destaque */}
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg border-0">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Valor Líquido</p>
                        <p className="text-3xl font-bold tracking-tight">{formatCurrencyBRL(resumo.valorLiquido)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Wallet className="size-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seção: Entradas */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span>Entradas</span>
                    <div className="h-px flex-1 bg-border" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="py-2 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-muted-foreground">Valor da Medição</p>
                          <p className="text-lg font-bold">{formatCurrencyBRL(resumo.valorMedicao)}</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Briefcase className="size-4 text-primary" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="py-2 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-muted-foreground">Pagamento do Contrato</p>
                          <p className="text-lg font-bold text-blue-600">{formatCurrencyBRL(resumo.pagamentoContrato)}</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <TrendingUp className="size-4 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Seção: Saídas */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span>Saídas</span>
                    <div className="h-px flex-1 bg-border" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="py-2 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-muted-foreground">Total de Gastos</p>
                          <p className="text-lg font-bold text-rose-600">{formatCurrencyBRL(resumo.totalGastos)}</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <TrendingDown className="size-4 text-rose-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="py-2 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-muted-foreground">Valor da Retenção</p>
                          <p className="text-lg font-bold text-amber-600">{formatCurrencyBRL(resumo.valorRetencao)}</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <FileText className="size-4 text-amber-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
