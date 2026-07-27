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
import { cn, getErrorMessage } from "@/lib/utils"
import { FuncionarioFormDialog } from "@/components/funcionarios/funcionario-form-dialog"
import { ImportarFuncionariosDialog } from "@/components/funcionarios/importar-funcionarios-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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

const TOTAIS_VAZIOS = {
  salarioBase: 0,
  vtInformado: 0,
  vrInformado: 0,
  descVt: 0,
  periculosidadeValor: 0,
  inssEmpregadoValor: 0,
  descVa: 0,
  liquido: 0,
  fgts: 0,
  inssPatronal: 0,
  rat: 0,
  terceiros: 0,
  totalEncargos: 0,
  custoEmpresa: 0,
}

export function FuncionariosList({ contratoId }: { contratoId: string }) {
  const { data: funcionarios, isLoading } = useFuncionarios(contratoId)
  const deleteFuncionario = useDeleteFuncionario(contratoId)
  const [paraExcluir, setParaExcluir] = useState<Funcionario | null>(null)

  const totais = (funcionarios ?? []).reduce((acc, funcionario) => {
    const encargos = calcularEncargos(funcionario)
    return {
      salarioBase: acc.salarioBase + funcionario.salario_base,
      vtInformado: acc.vtInformado + funcionario.vt_informado,
      vrInformado: acc.vrInformado + funcionario.vr_informado,
      descVt: acc.descVt + encargos.descVt,
      periculosidadeValor: acc.periculosidadeValor + encargos.periculosidadeValor,
      inssEmpregadoValor: acc.inssEmpregadoValor + encargos.inssEmpregadoValor,
      descVa: acc.descVa + encargos.descVa,
      liquido: acc.liquido + encargos.liquido,
      fgts: acc.fgts + encargos.fgts,
      inssPatronal: acc.inssPatronal + encargos.inssPatronal,
      rat: acc.rat + encargos.rat,
      terceiros: acc.terceiros + encargos.terceiros,
      totalEncargos: acc.totalEncargos + encargos.totalEncargos,
      custoEmpresa: acc.custoEmpresa + encargos.custoEmpresa,
    }
  }, TOTAIS_VAZIOS)

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
    <div className="flex w-full min-w-0 flex-col gap-4">
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

      <div className="scrollbar-always max-h-[70vh] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 left-0 z-30 border-r bg-background">Nome</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background">CPF</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background">Função</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background">Admissão</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">Salário Base</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">VT Informado</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">VR Informado</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">Desc. VT (6%)</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">30% Periculosidade</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">INSS Empregado</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">Desc. VA (10%)</TableHead>
              <TableHead className="sticky top-0 z-20 bg-background text-right">Líquido do empregado</TableHead>
              <TableHead className="bg-primary-tint-solid sticky top-0 z-20 text-right">FGTS 8%</TableHead>
              <TableHead className="bg-primary-tint-solid sticky top-0 z-20 text-right">INSS Patronal 20%</TableHead>
              <TableHead className="bg-primary-tint-solid sticky top-0 z-20 text-right">RAT 3%</TableHead>
              <TableHead className="bg-primary-tint-solid sticky top-0 z-20 text-right">Terceiros 5,8%</TableHead>
              <TableHead className="bg-primary-tint-solid sticky top-0 z-20 text-right">Total Encargos</TableHead>
              <TableHead className="bg-primary-tint-solid sticky top-0 z-20 text-right">Custo Empresa</TableHead>
              <TableHead className="sticky top-0 z-20 w-10 bg-background" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={19}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && (funcionarios ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={19}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum funcionário cadastrado neste contrato.
                </TableCell>
              </TableRow>
            )}
            {(funcionarios ?? []).map((funcionario, index) => {
              const encargos = calcularEncargos(funcionario)
              const linhaBg = index % 2 === 1 ? "bg-secondary" : "bg-background"
              return (
                <TableRow key={funcionario.id} className={linhaBg}>
                  <TableCell
                    className={cn("sticky left-0 z-10 border-r font-medium whitespace-nowrap", linhaBg)}
                  >
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
                  <TableCell className="bg-primary/5 text-right font-medium whitespace-nowrap">
                    {formatCurrencyBRL(encargos.totalEncargos)}
                  </TableCell>
                  <TableCell className="bg-primary/5 text-right font-medium whitespace-nowrap">
                    {formatCurrencyBRL(encargos.custoEmpresa)}
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
          {!isLoading && (funcionarios ?? []).length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted hover:bg-muted">
                <TableCell className="sticky left-0 z-10 border-r bg-muted font-semibold whitespace-nowrap">
                  Total
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.salarioBase)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.vtInformado)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.vrInformado)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.descVt)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.periculosidadeValor)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.inssEmpregadoValor)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.descVa)}
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.liquido)}
                </TableCell>
                <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.fgts)}
                </TableCell>
                <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.inssPatronal)}
                </TableCell>
                <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.rat)}
                </TableCell>
                <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.terceiros)}
                </TableCell>
                <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.totalEncargos)}
                </TableCell>
                <TableCell className="bg-primary/10 text-right font-semibold whitespace-nowrap">
                  {formatCurrencyBRL(totais.custoEmpresa)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
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
