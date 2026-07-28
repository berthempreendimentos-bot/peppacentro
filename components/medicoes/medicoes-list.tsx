"use client"

import { useState } from "react"
import { FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useMedicoes, useDeleteMedicao, type Medicao } from "@/lib/queries/medicoes"
import { medicaoStatusOptions } from "@/lib/validations/medicoes"
import { formatCurrencyBRL, formatDate, formatDateShort } from "@/lib/format"
import { MedicaoFormDialog } from "@/components/medicoes/medicao-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const statusLabel = Object.fromEntries(medicaoStatusOptions.map((o) => [o.value, o.label]))
const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  pendente: "outline",
  aprovada: "secondary",
  paga: "default",
  atrasada: "destructive",
  rejeitada: "destructive",
}

export function MedicoesList({ contratoId }: { contratoId: string }) {
  const { data: medicoes, isLoading } = useMedicoes(contratoId)
  const deleteMedicao = useDeleteMedicao(contratoId)
  const [paraExcluir, setParaExcluir] = useState<Medicao | null>(null)

  const proximoNumero = medicoes && medicoes.length > 0 ? medicoes[0].numero + 1 : 1

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteMedicao.mutateAsync(paraExcluir.id)
      toast.success("Medição removida")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover medição")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <MedicaoFormDialog
          contratoId={contratoId}
          proximoNumero={proximoNumero}
          trigger={
            <Button>
              <Plus /> Nova Medição
            </Button>
          }
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>% Executado</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && medicoes?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhuma medição cadastrada.
                </TableCell>
              </TableRow>
            )}
            {medicoes?.map((medicao) => (
              <TableRow key={medicao.id}>
                <TableCell className="font-medium">{medicao.numero}</TableCell>
                <TableCell>{formatDateShort(medicao.competencia)}</TableCell>
                <TableCell>{formatCurrencyBRL(medicao.valor)}</TableCell>
                <TableCell>{medicao.percentual_executado}%</TableCell>
                <TableCell>{formatDate(medicao.data)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[medicao.status]}>
                    {statusLabel[medicao.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" title="Baixar Espelho de Medição (PDF)" asChild>
                    <a href={`/api/medicoes/${medicao.id}/pdf`}>
                      <FileText className="size-4" />
                    </a>
                  </Button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <MedicaoFormDialog
                        contratoId={contratoId}
                        medicao={medicao}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setParaExcluir(medicao)}
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
            <AlertDialogTitle>Excluir medição?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O lançamento financeiro gerado a partir
              desta medição não será removido automaticamente.
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
