"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2, Wallet } from "lucide-react"
import { toast } from "sonner"

import { useContratos, useDeleteContrato, type Contrato } from "@/lib/queries/contratos"
import { calcularDuracaoContrato } from "@/lib/contrato-duracao"
import { formatCurrencyBRL } from "@/lib/format"
import { ContratoFormDialog } from "@/components/contratos/contrato-form-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  inicializacao: "Inicialização",
}

const situacaoVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  em_andamento: "default",
  executado: "secondary",
  encerrado: "outline",
  cancelado: "destructive",
  inicializacao: "default",
}

const situacaoColor: Record<string, string> = {
  em_andamento: "border-l-primary",
  executado: "border-l-secondary",
  encerrado: "border-l-muted-foreground",
  cancelado: "border-l-destructive",
  inicializacao: "border-l-blue-500",
}

const situacaoBadgeClassName: Record<string, string> = {
  inicializacao: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
}

export function ContratosTable() {
  const { data: contratos, isLoading } = useContratos()
  const deleteContrato = useDeleteContrato()
  const [search, setSearch] = useState("")
  const [situacaoFiltro, setSituacaoFiltro] = useState("todos")
  const [paraExcluir, setParaExcluir] = useState<Contrato | null>(null)

  const filtrados = (contratos ?? []).filter((c) => {
    if (situacaoFiltro !== "todos" && c.situacao !== situacaoFiltro) return false
    return `${c.numero} ${c.objeto} ${c.clientes?.nome ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  })

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
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por número, objeto ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={situacaoFiltro} onValueChange={setSituacaoFiltro}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            {Object.entries(situacaoLabel).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
          const numPostos = contrato.postos_servico?.reduce((sum, p) => sum + (p.quantidade || 0), 0) ?? 0
          const duracao = calcularDuracaoContrato(contrato.data_inicio, contrato.data_fim)
          const valorMensal = contrato.valor_atual / duracao.total
          const borderColor = situacaoColor[contrato.situacao] || "border-l-border"

          return (
            <Card key={contrato.id} className={`flex flex-col border-l-4 transition-shadow hover:shadow-md ${borderColor}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">
                    <Link href={`/contratos/${contrato.id}`} className="hover:underline">
                      {contrato.numero}
                    </Link>
                  </CardTitle>
                  <Badge
                    variant={situacaoVariant[contrato.situacao]}
                    className={situacaoBadgeClassName[contrato.situacao]}
                  >
                    {situacaoLabel[contrato.situacao]}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-1" title={contrato.clientes?.nome ?? ""}>
                  {contrato.clientes?.nome ?? "Sem cliente"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-sm">
                  <p className="label-caps text-muted-foreground mb-1">Objeto</p>
                  <p className="line-clamp-2" title={contrato.objeto}>{contrato.objeto}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="label-caps text-muted-foreground mb-1">Duração</p>
                    <p className="font-medium">
                      {duracao.atual !== null ? `${duracao.atual} / ${duracao.total} meses` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="label-caps text-muted-foreground mb-1">Postos</p>
                    <p className="font-medium">{numPostos}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t pt-3">
                  <div>
                    <p className="label-caps text-muted-foreground mb-0.5">
                      Valor Mensal{duracao.estimado && " (estimado)"}
                    </p>
                    <p className="font-mono text-xl font-bold text-primary">
                      {formatCurrencyBRL(valorMensal)}
                    </p>
                  </div>
                  <div>
                    <p className="label-caps text-muted-foreground mb-0.5">Valor Total</p>
                    <p className="font-mono text-base font-medium text-muted-foreground">
                      {formatCurrencyBRL(contrato.valor_atual)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-4 flex items-center justify-end gap-2 border-t bg-muted/20">
                <Link href={`/contratos/${contrato.id}?tab=financeiro`}>
                  <Button variant="outline" size="icon-sm" title="Lançamentos">
                    <Wallet className="size-4" />
                  </Button>
                </Link>
                <ContratoFormDialog
                  contrato={contrato}
                  trigger={
                    <Button variant="outline" size="icon-sm" title="Editar contrato">
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  title="Excluir contrato"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setParaExcluir(contrato)}
                >
                  <Trash2 className="size-4" />
                </Button>
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
