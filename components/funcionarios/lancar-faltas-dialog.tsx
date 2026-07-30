"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useFuncionarios } from "@/lib/queries/funcionarios"
import {
  useCreateOcorrencia,
  useDeleteOcorrenciaDoMes,
  useOcorrenciasDoMes,
} from "@/lib/queries/ocorrencias"
import { ImportarAsoDialog } from "@/components/funcionarios/importar-aso-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrencyBRL } from "@/lib/format"
import { Check, ChevronsUpDown, Trash2, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const TIPO_LABEL: Record<"falta" | "reembolso" | "aso", string> = {
  falta: "Falta",
  reembolso: "Reembolso",
  aso: "ASO",
}

const TIPO_CLASS: Record<"falta" | "reembolso" | "aso", string> = {
  falta: "bg-destructive/10 text-destructive",
  reembolso: "bg-primary/10 text-primary",
  aso: "bg-amber-500/10 text-amber-600",
}

function getMesAtual() {
  const d = new Date()
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const y = d.getFullYear()
  return `${y}-${m}`
}

export function LancarFaltasDialog({
  contratoId,
  trigger,
}: {
  contratoId: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios(contratoId)
  
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string>("")
  const [mesReferencia, setMesReferencia] = useState(getMesAtual())
  const [tipo, setTipo] = useState<"falta" | "reembolso" | "aso">("falta")
  const [valor, setValor] = useState(0)
  const [descricao, setDescricao] = useState("")

  const { data: ocorrenciasDoMes, isLoading: loadingOcorrencias } = useOcorrenciasDoMes(
    contratoId,
    mesReferencia
  )
  const createOcorrencia = useCreateOcorrencia(selectedFuncionarioId, contratoId, mesReferencia)
  const deleteOcorrencia = useDeleteOcorrenciaDoMes(contratoId, mesReferencia)

  async function handleAdd() {
    if (!selectedFuncionarioId) {
      toast.error("Selecione um funcionário.")
      return
    }
    if (!mesReferencia) {
      toast.error("Selecione o mês de referência.")
      return
    }
    if (valor <= 0) {
      toast.error("O valor deve ser maior que zero.")
      return
    }
    if (!descricao.trim()) {
      toast.error("Informe uma descrição.")
      return
    }

    try {
      await createOcorrencia.mutateAsync({ tipo, valor, descricao })
      toast.success("Ocorrência registrada com sucesso.")
      setValor(0)
      setDescricao("")
    } catch (error) {
      toast.error("Erro ao registrar a ocorrência.")
      console.error(error)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Deseja realmente excluir este lançamento?")) {
      try {
        await deleteOcorrencia.mutateAsync(id)
        toast.success("Ocorrência excluída com sucesso.")
      } catch (error) {
        toast.error("Erro ao excluir a ocorrência.")
        console.error(error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lançamentos e Ocorrências</DialogTitle>
          <DialogDescription>
            Registre as faltas e reembolsos com detalhes para manter o histórico na folha.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Funcionário</label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between"
                      disabled={loadingFuncionarios}
                    >
                      {selectedFuncionarioId
                        ? funcionarios?.find((f) => f.id === selectedFuncionarioId)?.nome
                        : "Buscar funcionário..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] sm:w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar por nome ou CPF..." />
                      <CommandList>
                        <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                        <CommandGroup>
                          {funcionarios?.map((f) => (
                            <CommandItem
                              key={f.id}
                              value={`${f.nome} ${f.cpf || ""} ${f.matricula || ""}`}
                              onSelect={() => {
                                setSelectedFuncionarioId(f.id)
                                setComboboxOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedFuncionarioId === f.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {f.nome} {f.cpf ? `(${f.cpf})` : ""}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Mês de Referência</label>
                <Input
                  type="month"
                  value={mesReferencia}
                  onChange={(e) => setMesReferencia(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={tipo}
                  onValueChange={(v: "falta" | "reembolso" | "aso") => setTipo(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="falta">Falta (Desconto)</SelectItem>
                    <SelectItem value="reembolso">Reembolso (Acréscimo)</SelectItem>
                    <SelectItem value="aso">Reembolso de ASO (Acréscimo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <CurrencyInput value={valor} onChange={setValor} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Ex: Falta injustificada no dia 10..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                onClick={handleAdd}
                disabled={createOcorrencia.isPending || !selectedFuncionarioId}
              >
                {createOcorrencia.isPending ? "Adicionando..." : "Adicionar Lançamento"}
              </Button>
              <ImportarAsoDialog
                contratoId={contratoId}
                mesReferencia={mesReferencia}
                trigger={
                  <Button variant="outline">
                    <Upload className="size-4" /> Importar ASO
                  </Button>
                }
              />
            </div>
          </div>

          {/* Lançamentos de todos os funcionários neste mês de referência */}
          <div className="mt-4 flex flex-col gap-2">
            <h4 className="text-sm font-semibold">
              Lançamentos deste mês ({mesReferencia})
            </h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOcorrencias ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : ocorrenciasDoMes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        Nenhum lançamento registrado neste mês.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ocorrenciasDoMes?.map((oc) => (
                      <TableRow key={oc.id}>
                        <TableCell className="max-w-[160px] truncate whitespace-nowrap">
                          {oc.funcionarios?.nome ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(oc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${TIPO_CLASS[oc.tipo]}`}
                          >
                            {TIPO_LABEL[oc.tipo]}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={oc.descricao}>
                          {oc.descricao}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrencyBRL(oc.valor)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(oc.id)}
                            disabled={deleteOcorrencia.isPending}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
