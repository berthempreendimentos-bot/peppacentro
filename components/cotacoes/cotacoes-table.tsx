"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useCotacoes, useDeleteCotacao, type Cotacao } from "@/lib/queries/cotacoes"
import { cotacaoStatusOptions } from "@/lib/validations/cotacoes"
import { formatDate } from "@/lib/format"
import { CotacaoFormDialog } from "@/components/cotacoes/cotacao-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const statusLabel = Object.fromEntries(cotacaoStatusOptions.map((o) => [o.value, o.label]))
const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  aberta: "default",
  fechada: "secondary",
  cancelada: "destructive",
}

export function CotacoesTable() {
  const { data: cotacoes, isLoading } = useCotacoes()
  const deleteCotacao = useDeleteCotacao()
  const [search, setSearch] = useState("")
  const [paraExcluir, setParaExcluir] = useState<Cotacao | null>(null)

  const filtradas = (cotacoes ?? []).filter((c) =>
    `${c.titulo} ${c.contratos?.numero ?? ""} ${c.contratos?.clientes?.nome ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteCotacao.mutateAsync(paraExcluir.id)
      toast.success("Cotação removida")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover cotação")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por título, contrato ou cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-24" />
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
            {!isLoading && filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhuma cotação encontrada. Clique em &quot;Nova Cotação&quot; para começar.
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((cotacao) => (
              <TableRow key={cotacao.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/cotacoes/${cotacao.id}`} className="block">
                    {cotacao.titulo}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/cotacoes/${cotacao.id}`} className="block">
                    {cotacao.contratos
                      ? `${cotacao.contratos.numero} · ${cotacao.contratos.clientes?.nome ?? ""}`
                      : "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cotacoes/${cotacao.id}`} className="block">
                    {cotacao.cotacao_itens.length}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/cotacoes/${cotacao.id}`} className="block">
                    {cotacao.cotacao_empresas.length}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[cotacao.status]}>
                    {statusLabel[cotacao.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(cotacao.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <CotacaoFormDialog
                      cotacao={cotacao}
                      trigger={
                        <Button variant="ghost" size="icon-sm" title="Editar">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Excluir"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setParaExcluir(cotacao)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!paraExcluir} onOpenChange={(open) => !open && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cotação?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todos os itens, empresas e preços
              cadastrados na cotação &quot;{paraExcluir?.titulo}&quot; também serão
              removidos.
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
