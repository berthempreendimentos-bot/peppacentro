"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useFornecedores,
  useDeleteFornecedor,
  type Fornecedor,
} from "@/lib/queries/fornecedores"
import { formatCpfCnpj } from "@/lib/format"
import { FornecedorFormDialog } from "@/components/fornecedores/fornecedor-form-dialog"
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

export function FornecedoresTable() {
  const { data: fornecedores, isLoading } = useFornecedores()
  const deleteFornecedor = useDeleteFornecedor()
  const [search, setSearch] = useState("")
  const [paraExcluir, setParaExcluir] = useState<Fornecedor | null>(null)

  const filtrados = (fornecedores ?? []).filter((f) =>
    `${f.nome} ${f.cpf_cnpj ?? ""}`.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteFornecedor.mutateAsync(paraExcluir.id)
      toast.success("Fornecedor removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover fornecedor")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por nome ou CPF/CNPJ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
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
            {!isLoading && filtrados.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                <TableCell>{formatCpfCnpj(fornecedor.cpf_cnpj)}</TableCell>
                <TableCell>{fornecedor.telefone || "—"}</TableCell>
                <TableCell>{fornecedor.email || "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <FornecedorFormDialog
                        fornecedor={fornecedor}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setParaExcluir(fornecedor)}
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
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O fornecedor &quot;{paraExcluir?.nome}
              &quot; será removido permanentemente.
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
