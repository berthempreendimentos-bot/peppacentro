"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"

import { useContratos, useDeleteContrato, type Contrato } from "@/lib/queries/contratos"
import { formatCurrencyBRL, formatDate } from "@/lib/format"
import { ContratoFormDialog } from "@/components/contratos/contrato-form-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Button } from "@/components/ui/button"
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

const situacaoLabel: Record<string, string> = {
  em_andamento: "Em andamento",
  executado: "Executado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
}

const situacaoVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  em_andamento: "default",
  executado: "secondary",
  encerrado: "outline",
  cancelado: "destructive",
}

export function ContratosTable() {
  const { data: contratos, isLoading } = useContratos()
  const deleteContrato = useDeleteContrato()
  const [search, setSearch] = useState("")
  const [paraExcluir, setParaExcluir] = useState<Contrato | null>(null)

  const filtrados = (contratos ?? []).filter((c) =>
    `${c.numero} ${c.objeto} ${c.clientes?.nome ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteContrato.mutateAsync(paraExcluir.id)
      toast.success("Contrato removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover contrato")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por número, objeto ou cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Objeto</TableHead>
              <TableHead>Valor atual</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Fim</TableHead>
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
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum contrato encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((contrato) => (
              <TableRow key={contrato.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/contratos/${contrato.id}`} className="block">
                    {contrato.numero}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/contratos/${contrato.id}`} className="block">
                    {contrato.clientes?.nome ?? "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/contratos/${contrato.id}`}
                    className="block max-w-xs truncate"
                  >
                    {contrato.objeto}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/contratos/${contrato.id}`} className="block">
                    {formatCurrencyBRL(contrato.valor_atual)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={situacaoVariant[contrato.situacao]}>
                    {situacaoLabel[contrato.situacao]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/contratos/${contrato.id}`} className="block">
                    {formatDate(contrato.data_fim)}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/contratos/${contrato.id}?tab=financeiro`}>
                      <Button variant="ghost" size="icon-sm" title="Lançamentos">
                        <Wallet className="size-4" />
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ContratoFormDialog
                          contrato={contrato}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="size-4" /> Editar
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setParaExcluir(contrato)}
                        >
                          <Trash2 className="size-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todos os aditivos, cronograma,
              lançamentos, medições e documentos vinculados ao contrato &quot;
              {paraExcluir?.numero}&quot; também serão removidos.
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
