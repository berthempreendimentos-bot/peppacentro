"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useCentroCustos,
  useDeleteCentroCusto,
  type CentroCusto,
} from "@/lib/queries/centro-custos"
import { CentroCustoFormDialog } from "@/components/centro-custos/centro-custo-form-dialog"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function CentroCustosList() {
  const { data, isLoading } = useCentroCustos()
  const deleteCentroCusto = useDeleteCentroCusto()
  const [paraExcluir, setParaExcluir] = useState<CentroCusto | null>(null)

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteCentroCusto.mutateAsync(paraExcluir.id)
      toast.success("Centro de custo removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CentroCustoFormDialog
          trigger={
            <Button>
              <Plus /> Novo Centro de Custo
            </Button>
          }
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Nenhum centro de custo cadastrado.
                </TableCell>
              </TableRow>
            )}
            {data?.map((cc) => (
              <TableRow key={cc.id}>
                <TableCell className="font-medium">{cc.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {cc.descricao || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <CentroCustoFormDialog
                      centroCusto={cc}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setParaExcluir(cc)}
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

      <AlertDialog
        open={!!paraExcluir}
        onOpenChange={(open) => !open && setParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir centro de custo?</AlertDialogTitle>
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
