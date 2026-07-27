"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  useFuncionarios,
  useDeleteFuncionario,
  type Funcionario,
} from "@/lib/queries/funcionarios"
import { calcularEncargos } from "@/lib/calculo-folha"
import { formatCpfCnpj, formatCurrencyBRL, formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import { FuncionarioFormDialog } from "@/components/funcionarios/funcionario-form-dialog"
import { ImportarFuncionariosDialog } from "@/components/funcionarios/importar-funcionarios-dialog"
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

export function FuncionariosList({ contratoId }: { contratoId: string }) {
  const { data: funcionarios, isLoading } = useFuncionarios(contratoId)
  const deleteFuncionario = useDeleteFuncionario(contratoId)
  const [paraExcluir, setParaExcluir] = useState<Funcionario | null>(null)

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteFuncionario.mutateAsync(paraExcluir.id)
      toast.success("Funcionário removido")
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao remover funcionário"))
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <ImportarFuncionariosDialog
          contratoId={contratoId}
          trigger={
            <Button variant="outline">
              <Upload /> Importar
            </Button>
          }
        />
        <FuncionarioFormDialog
          contratoId={contratoId}
          trigger={
            <Button>
              <Plus /> Novo Funcionário
            </Button>
          }
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead className="text-right">Salário Base</TableHead>
              <TableHead className="text-right">VT Informado</TableHead>
              <TableHead className="text-right">VR Informado</TableHead>
              <TableHead className="text-right">Desc. VT (6%)</TableHead>
              <TableHead className="text-right">30% Periculosidade</TableHead>
              <TableHead className="text-right">INSS Empregado</TableHead>
              <TableHead className="text-right">Desc. VA (10%)</TableHead>
              <TableHead className="text-right">Líquido do empregado</TableHead>
              <TableHead className="bg-primary/10 text-right">FGTS 8%</TableHead>
              <TableHead className="bg-primary/10 text-right">INSS Patronal 20%</TableHead>
              <TableHead className="bg-primary/10 text-right">RAT 3%</TableHead>
              <TableHead className="bg-primary/10 text-right">Terceiros 5,8%</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={17}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && (funcionarios ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={17}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum funcionário cadastrado neste contrato.
                </TableCell>
              </TableRow>
            )}
            {(funcionarios ?? []).map((funcionario) => {
              const encargos = calcularEncargos(funcionario)
              return (
                <TableRow key={funcionario.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {funcionario.nome}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatCpfCnpj(funcionario.cpf) || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {funcionario.funcao || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(funcionario.data_admissao)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(funcionario.salario_base)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(funcionario.vt_informado)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(funcionario.vr_informado)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.descVt)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.periculosidadeValor)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.inssEmpregadoValor)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({funcionario.inss_percentual}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.descVa)}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatCurrencyBRL(encargos.liquido)}
                  </TableCell>
                  <TableCell className="bg-primary/5 text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.fgts)}
                  </TableCell>
                  <TableCell className="bg-primary/5 text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.inssPatronal)}
                  </TableCell>
                  <TableCell className="bg-primary/5 text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.rat)}
                  </TableCell>
                  <TableCell className="bg-primary/5 text-right whitespace-nowrap">
                    {formatCurrencyBRL(encargos.terceiros)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <FuncionarioFormDialog
                          contratoId={contratoId}
                          funcionario={funcionario}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="size-4" /> Editar
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setParaExcluir(funcionario)}
                        >
                          <Trash2 className="size-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O funcionário &quot;{paraExcluir?.nome}
              &quot; será removido permanentemente deste contrato.
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
