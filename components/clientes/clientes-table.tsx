"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useClientes, useDeleteCliente, type Cliente } from "@/lib/queries/clientes"
import { formatCpfCnpj } from "@/lib/format"
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog"
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

export function ClientesTable() {
  const { data: clientes, isLoading } = useClientes()
  const deleteCliente = useDeleteCliente()
  const [search, setSearch] = useState("")
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null)

  const filtrados = (clientes ?? []).filter((c) =>
    `${c.nome} ${c.cpf_cnpj}`.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!clienteParaExcluir) return
    try {
      await deleteCliente.mutateAsync(clienteParaExcluir.id)
      toast.success("Cliente removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover cliente")
    } finally {
      setClienteParaExcluir(null)
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
              <TableHead>Tipo</TableHead>
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
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filtrados.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {cliente.tipo_pessoa === "PJ" ? "Jurídica" : "Física"}
                  </Badge>
                </TableCell>
                <TableCell>{formatCpfCnpj(cliente.cpf_cnpj)}</TableCell>
                <TableCell>{cliente.telefone || "—"}</TableCell>
                <TableCell>{cliente.email || "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ClienteFormDialog
                        cliente={cliente}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setClienteParaExcluir(cliente)}
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
        open={!!clienteParaExcluir}
        onOpenChange={(open) => !open && setClienteParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O cliente &quot;{clienteParaExcluir?.nome}
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
