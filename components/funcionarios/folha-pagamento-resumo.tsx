"use client"

import {
  Banknote,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Landmark,
  ShieldCheck,
  Users,
  Calculator,
} from "lucide-react"

import { useFuncionarios } from "@/lib/queries/funcionarios"
import { calcularEncargos, somarTotais } from "@/lib/calculo-folha"
import { useTributos, taxasParaQueryString } from "@/hooks/use-tributos"
import { formatCurrencyBRL, formatMesAno } from "@/lib/format"
import { LancarFaltasDialog } from "@/components/funcionarios/lancar-faltas-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
}) {
  return (
    <Card className="accent-bar">
      <CardContent className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <p className="label-caps text-[0.6rem] text-muted-foreground">{label}</p>
          <p className="font-mono text-base font-semibold tracking-tight">{value}</p>
        </div>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

export function FolhaPagamentoResumo({ contratoId }: { contratoId: string }) {
  const { data: funcionarios, isLoading } = useFuncionarios(contratoId)
  const { taxas } = useTributos()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const lista = funcionarios ?? []
  const totais = somarTotais(lista, taxas)

  const porFuncao = new Map<
    string,
    { quantidade: number; salarioBase: number; liquido: number; totalEncargos: number; custoEmpresa: number }
  >()
  for (const funcionario of lista) {
    const chave = funcionario.funcao?.trim() || "Sem função"
    const encargos = calcularEncargos(funcionario, taxas)
    const atual = porFuncao.get(chave) ?? {
      quantidade: 0,
      salarioBase: 0,
      liquido: 0,
      totalEncargos: 0,
      custoEmpresa: 0,
    }
    porFuncao.set(chave, {
      quantidade: atual.quantidade + 1,
      salarioBase: atual.salarioBase + funcionario.salario_base,
      liquido: atual.liquido + encargos.liquido,
      totalEncargos: atual.totalEncargos + encargos.totalEncargos,
      custoEmpresa: atual.custoEmpresa + encargos.custoEmpresa,
    })
  }
  const linhasPorFuncao = Array.from(porFuncao.entries())
    .map(([funcao, valores]) => ({ funcao, ...valores }))
    .sort((a, b) => b.custoEmpresa - a.custoEmpresa)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label-caps text-muted-foreground">
          Referência: <span className="text-foreground">{formatMesAno()}</span>
        </p>
        <div className="flex gap-2">
          <LancarFaltasDialog
            contratoId={contratoId}
            trigger={
              <Button variant="secondary" size="sm">
                <Calculator className="mr-2 size-4" /> Lançamentos
              </Button>
            }
          />
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/funcionarios/${contratoId}/folha-excel?${taxasParaQueryString(taxas)}`}>
              <FileSpreadsheet /> Excel
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/funcionarios/${contratoId}/folha-pdf?${taxasParaQueryString(taxas)}`}>
              <FileText /> PDF
            </a>
          </Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum funcionário cadastrado neste contrato ainda.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Funcionários" value={totais.quantidade} icon={Users} />
            <KpiCard
              label="Total Salário Base"
              value={formatCurrencyBRL(totais.salarioBase)}
              icon={Banknote}
            />
            <KpiCard label="Total Líquido" value={formatCurrencyBRL(totais.liquido)} icon={HandCoins} />
            <KpiCard
              label="Total Encargos Patronais"
              value={formatCurrencyBRL(totais.totalEncargos)}
              icon={ShieldCheck}
            />
            <KpiCard
              label="Custo Total da Folha"
              value={formatCurrencyBRL(totais.custoEmpresa)}
              icon={Landmark}
            />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="label-caps text-muted-foreground">Resumo por função</h2>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Salário Base</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead className="bg-primary-tint-solid text-right">
                      Encargos Patronais
                    </TableHead>
                    <TableHead className="bg-primary-tint-solid text-right">Custo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasPorFuncao.map((linha) => (
                    <TableRow key={linha.funcao}>
                      <TableCell className="font-medium whitespace-nowrap">{linha.funcao}</TableCell>
                      <TableCell className="text-right">{linha.quantidade}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrencyBRL(linha.salarioBase)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrencyBRL(linha.liquido)}
                      </TableCell>
                      <TableCell className="bg-primary/5 text-right whitespace-nowrap">
                        {formatCurrencyBRL(linha.totalEncargos)}
                      </TableCell>
                      <TableCell className="bg-primary/5 text-right font-medium whitespace-nowrap">
                        {formatCurrencyBRL(linha.custoEmpresa)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableCell className="font-semibold whitespace-nowrap">Total</TableCell>
                    <TableCell className="text-right font-semibold">{totais.quantidade}</TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {formatCurrencyBRL(totais.salarioBase)}
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {formatCurrencyBRL(totais.liquido)}
                    </TableCell>
                    <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                      {formatCurrencyBRL(totais.totalEncargos)}
                    </TableCell>
                    <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                      {formatCurrencyBRL(totais.custoEmpresa)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
