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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        {!isLoading && filtrados.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Nenhum contrato encontrado.
          </div>
        )}
        {filtrados.map((contrato) => {
          const numPostos = contrato.postos_servico?.[0]?.count ?? 0
          return (
            <Card key={contrato.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">
                    <Link href={`/contratos/${contrato.id}`} className="hover:underline">
                      {contrato.numero}
                    </Link>
                  </CardTitle>
                  <Badge variant={situacaoVariant[contrato.situacao]}>
                    {situacaoLabel[contrato.situacao]}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-1" title={contrato.clientes?.nome ?? ""}>
                  {contrato.clientes?.nome ?? "Sem cliente"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Objeto</p>
                  <p className="line-clamp-2" title={contrato.objeto}>{contrato.objeto}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fim</p>
                    <p className="font-medium">{formatDate(contrato.data_fim)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Postos</p>
                    <p className="font-medium">{numPostos}</p>
                  </div>
                </div>
                <div className="pt-2 border-t text-sm">
                  <p className="text-muted-foreground mb-1">Valor Atual</p>
                  <p className="font-semibold text-lg">{formatCurrencyBRL(contrato.valor_atual)}</p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-4 flex items-center justify-end gap-2 border-t bg-muted/20">
                <Link href={`/contratos/${contrato.id}?tab=financeiro`}>
                  <Button variant="outline" size="sm" title="Lançamentos">
                    <Wallet className="size-4 mr-2" />
                    Finanças
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
                          <Pencil className="size-4 mr-2" /> Editar
                        </DropdownMenuItem>
                      }
                    />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setParaExcluir(contrato)}
                    >
                      <Trash2 className="size-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          )
        })}
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
