"use client"

import { Banknote, HandCoins, Landmark, ShieldCheck, Users } from "lucide-react"

import { useFuncionarios } from "@/lib/queries/funcionarios"
import { calcularEncargos, somarTotais } from "@/lib/calculo-folha"
import { formatCurrencyBRL } from "@/lib/format"
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
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <p className="label-caps text-muted-foreground">{label}</p>
          <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

export function FolhaPagamentoResumo({ contratoId }: { contratoId: string }) {
  const { data: funcionarios, isLoading } = useFuncionarios(contratoId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const lista = funcionarios ?? []
  const totais = somarTotais(lista)

  const porFuncao = new Map<
    string,
    { quantidade: number; salarioBase: number; liquido: number; totalEncargos: number; custoEmpresa: number }
  >()
  for (const funcionario of lista) {
    const chave = funcionario.funcao?.trim() || "Sem função"
    const encargos = calcularEncargos(funcionario)
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

  if (lista.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nenhum funcionário cadastrado neste contrato ainda.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Funcionários" value={totais.quantidade} icon={Users} />
        <KpiCard label="Total Salário Base" value={formatCurrencyBRL(totais.salarioBase)} icon={Banknote} />
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
    </div>
  )
}
