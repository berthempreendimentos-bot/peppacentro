"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { Plus } from "lucide-react"

import { useLancamentosGlobal } from "@/lib/queries/lancamentos"
import { lancamentoStatusOptions, lancamentoTipoOptions } from "@/lib/validations/lancamentos"
import { formatCurrencyBRL, formatDate } from "@/lib/format"
import { LancamentoFormDialog } from "@/components/financeiro/lancamento-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const tipoLabel = Object.fromEntries(lancamentoTipoOptions.map((o) => [o.value, o.label]))
const statusLabel = Object.fromEntries(lancamentoStatusOptions.map((o) => [o.value, o.label]))
const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  pendente: "outline",
  pago: "default",
  atrasado: "destructive",
  cancelado: "secondary",
}
const ENTRADAS = new Set(["receita", "recebimento"])

function formatMesReferencia(yyyyMM: string) {
  const [ano, mes] = yyyyMM.split("-")
  const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
  return `${meses[parseInt(mes, 10) - 1]}/${ano}`
}

export function LancamentosGlobaisTable() {
  const { data: lancamentos, isLoading } = useLancamentosGlobal()
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [status, setStatus] = useState("todos")
  const [mes, setMes] = useState("todos")

  const mesesDisponiveis = useMemo(() => {
    if (!lancamentos) return []
    const mSet = new Set<string>()
    lancamentos.forEach((l) => {
      mSet.add(l.mes_referencia || l.data.substring(0, 7))
    })
    return Array.from(mSet).sort((a, b) => b.localeCompare(a))
  }, [lancamentos])

  const filtrados = useMemo(() => {
    return (lancamentos ?? []).filter((l) => {
      if (tipo !== "todos" && l.tipo !== tipo) return false
      if (status !== "todos" && l.status !== status) return false
      const lMes = l.mes_referencia || l.data.substring(0, 7)
      if (mes !== "todos" && lMes !== mes) return false
      const texto = `${l.descricao} ${l.contratos?.numero ?? ""} ${l.contratos?.clientes?.nome ?? ""}`
      return texto.toLowerCase().includes(search.toLowerCase())
    })
  }, [lancamentos, search, tipo, status, mes])

  const totalReceitas = filtrados
    .filter((l) => ENTRADAS.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)
  const totalDespesas = filtrados
    .filter((l) => !ENTRADAS.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Receitas/Recebimentos</p>
            <p className="text-xl font-semibold">{formatCurrencyBRL(totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Despesas/Pagamentos</p>
            <p className="text-xl font-semibold">{formatCurrencyBRL(totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Saldo</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">
                {formatCurrencyBRL(totalReceitas - totalDespesas)}
              </p>
              {totalReceitas > 0 && (
                <span
                  className={`text-sm font-medium ${
                    totalReceitas - totalDespesas >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ({totalReceitas - totalDespesas > 0 ? "+" : ""}
                  {(((totalReceitas - totalDespesas) / totalReceitas) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por descrição, contrato ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {lancamentoTipoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {lancamentoStatusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            {mesesDisponiveis.map((m) => (
              <SelectItem key={m} value={m}>
                {formatMesReferencia(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <LancamentoFormDialog
          trigger={
            <Button className="ml-auto">
              <Plus /> Novo Lançamento
            </Button>
          }
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{formatDate(l.data)}</TableCell>
                <TableCell>
                  <Link
                    href={`/contratos/${l.contrato_id}?tab=financeiro`}
                    className="hover:underline"
                  >
                    {l.contratos?.numero} · {l.contratos?.clientes?.nome}
                  </Link>
                </TableCell>
                <TableCell>{tipoLabel[l.tipo]}</TableCell>
                <TableCell className="max-w-xs truncate">{l.descricao}</TableCell>
                <TableCell>{formatCurrencyBRL(l.valor)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[l.status]}>{statusLabel[l.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
