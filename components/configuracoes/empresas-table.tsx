"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useEmpresas,
  useDeleteEmpresa,
  type Empresa,
} from "@/lib/queries/empresas"
import { formatCpfCnpj } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import { EmpresaFormDialog } from "@/components/configuracoes/empresa-form-dialog"
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

export function EmpresasTable() {
  const { data: empresas, isLoading } = useEmpresas()
  const deleteEmpresa = useDeleteEmpresa()
  const [search, setSearch] = useState("")
  const [paraExcluir, setParaExcluir] = useState<Empresa | null>(null)

  const filtradas = (empresas ?? []).filter((e) =>
    `${e.nome} ${e.nome_fantasia ?? ""} ${e.cnpj ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteEmpresa.mutateAsync(paraExcluir.id)
      toast.success("Empresa removida")
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao remover empresa"))
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por nome ou CNPJ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filtradas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhuma empresa cadastrada.
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell className="font-medium">
                  {empresa.nome}
                  {empresa.nome_fantasia && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {empresa.nome_fantasia}
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatCpfCnpj(empresa.cnpj)}</TableCell>
                <TableCell>{empresa.telefone || "—"}</TableCell>
                <TableCell>{empresa.email || "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EmpresaFormDialog
                        empresa={empresa}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setParaExcluir(empresa)}
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
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A empresa &quot;{paraExcluir?.nome}
              &quot; será removida permanentemente.
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
