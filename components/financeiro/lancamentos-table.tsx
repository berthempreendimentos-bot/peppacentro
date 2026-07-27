"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useLancamentos,
  useDeleteLancamento,
  type Lancamento,
} from "@/lib/queries/lancamentos"
import { lancamentoStatusOptions, lancamentoTipoOptions } from "@/lib/validations/lancamentos"
import { formatCurrencyBRL, formatDate } from "@/lib/format"
import { LancamentoFormDialog } from "@/components/financeiro/lancamento-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

export function LancamentosTable({ contratoId }: { contratoId: string }) {
  const { data: lancamentos, isLoading } = useLancamentos(contratoId)
  const deleteLancamento = useDeleteLancamento(contratoId)
  const [paraExcluir, setParaExcluir] = useState<Lancamento | null>(null)

  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [status, setStatus] = useState("todos")
  const [mes, setMes] = useState("todos")

  const mesesDisponiveis = useMemo(() => {
    if (!lancamentos) return []
    const mSet = new Set<string>()
    lancamentos.forEach((l) => {
      mSet.add(l.data.substring(0, 7))
    })
    return Array.from(mSet).sort((a, b) => b.localeCompare(a))
  }, [lancamentos])

  const filtrados = useMemo(() => {
    return (lancamentos ?? []).filter((l) => {
      if (tipo !== "todos" && l.tipo !== tipo) return false
      if (status !== "todos" && l.status !== status) return false
      if (mes !== "todos" && l.data.substring(0, 7) !== mes) return false
      const texto = `${l.descricao} ${l.categorias?.nome ?? ""}`
      return texto.toLowerCase().includes(search.toLowerCase())
    })
  }, [lancamentos, search, tipo, status, mes])

  const totalReceitas = filtrados
    .filter((l) => ENTRADAS.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)
  const totalDespesas = filtrados
    .filter((l) => !ENTRADAS.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteLancamento.mutateAsync(paraExcluir.id)
      toast.success("Lançamento removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover lançamento")
    } finally {
      setParaExcluir(null)
    }
  }

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm w-[250px]"
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
        </div>
        <LancamentoFormDialog
          contratoId={contratoId}
          trigger={
            <Button>
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
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((lancamento) => (
              <TableRow key={lancamento.id}>
                <TableCell>{formatDate(lancamento.data)}</TableCell>
                <TableCell>{tipoLabel[lancamento.tipo]}</TableCell>
                <TableCell className="max-w-xs truncate">{lancamento.descricao}</TableCell>
                <TableCell className="text-muted-foreground">
                  {lancamento.categorias?.nome ?? "—"}
                </TableCell>
                <TableCell>{formatCurrencyBRL(lancamento.valor)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[lancamento.status]}>
                    {statusLabel[lancamento.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <LancamentoFormDialog
                        contratoId={contratoId}
                        lancamento={lancamento}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setParaExcluir(lancamento)}
                      >
                        <Trash2 className="size-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!paraExcluir}
        onOpenChange={(open) => !open && setParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
