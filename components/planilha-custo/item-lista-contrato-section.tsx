"use client"

import { useState } from "react"
import { Plus, Trash2, Trash } from "lucide-react"
import { toast } from "sonner"
import type { UseMutationResult } from "@tanstack/react-query"

import type { ItemSimples } from "@/lib/xlsx/analyze"
import type { ItemListaContrato } from "@/lib/queries/itens-lista-contrato"
import { formatCurrencyBRL } from "@/lib/format"
import { AnalisarListaSimplesDialog } from "@/components/planilha-custo/analisar-lista-simples-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function AdicionarManualDialog({
  tipoLabel,
  onAdicionar,
}: {
  tipoLabel: string
  onAdicionar: UseMutationResult<
    void,
    Error,
    { nome: string; quantidade?: number; valorUnitario?: number }
  >
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [valor, setValor] = useState<number | "">("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error("Informe o nome")
      return
    }
    try {
      await onAdicionar.mutateAsync({
        nome,
        quantidade,
        valorUnitario: valor === "" ? undefined : valor,
      })
      toast.success(`${tipoLabel} adicionado`)
      setNome("")
      setQuantidade(1)
      setValor("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar {tipoLabel.toLowerCase()}</DialogTitle>
          <DialogDescription>Vinculado a este contrato.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.valueAsNumber || 1)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Valor unitário</Label>
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value === "" ? "" : e.target.valueAsNumber)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={onAdicionar.isPending}>
              {onAdicionar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ItemListaContratoSection({
  contratoId,
  titulo,
  tipoLabel,
  itens,
  isLoading,
  onAdicionar,
  onExcluir,
  importarItens,
}: {
  contratoId: string
  titulo: string
  tipoLabel: string
  itens: ItemListaContrato[] | undefined
  isLoading: boolean
  onAdicionar: UseMutationResult<
    void,
    Error,
    { nome: string; quantidade?: number; valorUnitario?: number }
  >
  onExcluir: UseMutationResult<void, Error, string>
  importarItens: UseMutationResult<
    void,
    Error,
    { documentoId: string; abaOrigem: string; itens: ItemSimples[] }
  >
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  const total = selectedIds.size > 0
    ? (itens ?? []).filter((i) => selectedIds.has(i.id)).reduce((acc, i) => acc + i.valor_total, 0)
    : (itens ?? []).reduce((acc, i) => acc + i.valor_total, 0)

  async function handleExcluirSelecionados() {
    if (selectedIds.size === 0) return
    if (!confirm(`Deseja realmente excluir os ${selectedIds.size} itens selecionados?`)) return
    
    setIsDeletingBulk(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => onExcluir.mutateAsync(id)))
      toast.success(`${selectedIds.size} itens removidos`)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover itens selecionados")
    } finally {
      setIsDeletingBulk(false)
    }
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set((itens ?? []).map((i) => i.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function toggleSelect(id: string, checked: boolean) {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  async function handleExcluir(id: string) {
    try {
      await onExcluir.mutateAsync(id)
      toast.success(`${tipoLabel} removido`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Card className="accent-bar flex-1">
          <CardContent className="flex items-center justify-between">
            <span className="label-caps text-muted-foreground">{titulo}</span>
            <span className="font-mono text-xl font-semibold">{formatCurrencyBRL(total)}</span>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleExcluirSelecionados}
              disabled={isDeletingBulk}
            >
              <Trash className="mr-2 h-4 w-4" />
              Excluir ({selectedIds.size})
            </Button>
          )}
          <AnalisarListaSimplesDialog
            contratoId={contratoId}
            tipoLabel={tipoLabel}
            importarItens={importarItens}
            trigger={
              <Button variant="outline">
                <Plus /> Analisar Planilha
              </Button>
            }
          />
          <AdicionarManualDialog tipoLabel={tipoLabel} onAdicionar={onAdicionar} />
        </div>
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}

      {!isLoading && (itens?.length ?? 0) === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhum(a) {tipoLabel.toLowerCase()} cadastrado(a) ainda.
        </p>
      )}

      {!isLoading && (itens?.length ?? 0) > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={itens && itens.length > 0 && selectedIds.size === itens.length}
                    onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Valor unitário</TableHead>
                <TableHead>Valor total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) => toggleSelect(item.id, checked === true)}
                      aria-label={`Selecionar ${item.nome}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.aba_origem ?? "—"}
                  </TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>{formatCurrencyBRL(item.valor_unitario)}</TableCell>
                  <TableCell className="font-mono font-semibold">
                    {formatCurrencyBRL(item.valor_total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleExcluir(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
