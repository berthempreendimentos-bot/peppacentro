"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useUsuariosAdmin,
  useUpdateUsuario,
  useDeleteUsuario,
  type Usuario,
} from "@/lib/queries/usuarios"
import { getErrorMessage } from "@/lib/utils"
import type { UserRole } from "@/lib/supabase/database.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  financeiro: "Financeiro",
  fiscal: "Fiscal",
  visualizador: "Visualizador",
}

export function UsuariosTable({ usuarioAtualId }: { usuarioAtualId: string }) {
  const { data: usuarios, isLoading } = useUsuariosAdmin()
  const updateUsuario = useUpdateUsuario()
  const deleteUsuario = useDeleteUsuario()
  const [search, setSearch] = useState("")
  const [paraExcluir, setParaExcluir] = useState<Usuario | null>(null)

  const filtrados = (usuarios ?? []).filter((u) =>
    `${u.nome} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRoleChange(usuario: Usuario, role: UserRole) {
    try {
      await updateUsuario.mutateAsync({ id: usuario.id, input: { role } })
      toast.success("Perfil atualizado")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o perfil"))
    }
  }

  async function handleToggleAtivo(usuario: Usuario) {
    try {
      await updateUsuario.mutateAsync({
        id: usuario.id,
        input: { ativo: !usuario.ativo },
      })
      toast.success(usuario.ativo ? "Usuário desativado" : "Usuário ativado")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o usuário"))
    }
  }

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteUsuario.mutateAsync(paraExcluir.id)
      toast.success("Usuário excluído")
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao excluir usuário"))
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Situação</TableHead>
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
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((usuario) => {
              const isSelf = usuario.id === usuarioAtualId
              return (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">
                    {usuario.nome}
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                    )}
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Select
                      value={usuario.role}
                      onValueChange={(value) => handleRoleChange(usuario, value as UserRole)}
                      disabled={isSelf}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={usuario.ativo ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => !isSelf && handleToggleAtivo(usuario)}
                    >
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setParaExcluir(usuario)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!paraExcluir}
        onOpenChange={(open) => !open && setParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O usuário &quot;{paraExcluir?.nome}
              &quot; perderá o acesso ao sistema permanentemente.
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
