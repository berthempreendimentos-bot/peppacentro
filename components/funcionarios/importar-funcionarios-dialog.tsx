"use client"

import { useState } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  extrairFuncionarios,
  lerWorkbookFuncionarios,
  type FuncionarioImportado,
} from "@/lib/xlsx/funcionarios-import"
import { useImportFuncionarios } from "@/lib/queries/funcionarios"
import { getErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Etapa = "arquivo" | "revisar"

export function ImportarFuncionariosDialog({
  contratoId,
  trigger,
}: {
  contratoId: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("arquivo")
  const [carregando, setCarregando] = useState(false)
  const [funcionarios, setFuncionarios] = useState<FuncionarioImportado[]>([])
  const importarFuncionarios = useImportFuncionarios(contratoId)

  function resetTudo() {
    setEtapa("arquivo")
    setFuncionarios([])
  }

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCarregando(true)
    try {
      const bytes = await file.arrayBuffer()
      const workbook = lerWorkbookFuncionarios(bytes)
      const extraidos = extrairFuncionarios(workbook)
      if (extraidos.length === 0) {
        toast.error("Nenhum funcionário encontrado — confira se a coluna \"Nome\" está preenchida")
        return
      }
      setFuncionarios(extraidos)
      setEtapa("revisar")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível ler a planilha"))
    } finally {
      setCarregando(false)
      e.target.value = ""
    }
  }

  function updateFuncionario(linha: number, patch: Partial<FuncionarioImportado>) {
    setFuncionarios((prev) => prev.map((f) => (f.linha === linha ? { ...f, ...patch } : f)))
  }

  async function handleConfirmar() {
    try {
      const resultado = await importarFuncionarios.mutateAsync(funcionarios)
      if (resultado && resultado.atualizados > 0) {
        toast.success(
          `${resultado.importados} funcionário(s) novo(s) importado(s) — ${resultado.atualizados} já cadastrado(s) tiveram os dados atualizados`
        )
      } else {
        toast.success(`${resultado?.importados ?? 0} funcionário(s) importado(s) com sucesso`)
      }
      setOpen(false)
      resetTudo()
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível importar os funcionários"))
    }
  }

  const totalIncluidos = funcionarios.filter((f) => f.incluir).length

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetTudo()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[95vw] xl:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Importar funcionários de uma planilha</DialogTitle>
          <DialogDescription>
            Colunas reconhecidas: Nome, Matrícula, CPF, Cargo, Admissão, Salário Base, VT Informado e VR
            Informado.
          </DialogDescription>
        </DialogHeader>

        {etapa === "arquivo" && (
          <div className="flex flex-col gap-4">
            <a
              href="/api/funcionarios/template"
              download
              className="flex w-fit items-center gap-2 text-sm text-primary underline underline-offset-4"
            >
              <Download className="size-4" /> Baixar planilha modelo
            </a>
            <div className="flex flex-col gap-2">
              <Label>Arquivo da planilha (.xlsx)</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleArquivo}
                disabled={carregando}
              />
            </div>
          </div>
        )}

        {etapa === "revisar" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Desmarque o que não deve entrar e ajuste os dados se precisar.
            </p>
            <p className="text-sm font-medium">
              {totalIncluidos} de {funcionarios.length} funcionário(s) encontrado(s) serão
              importados.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Nome</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Admissão</TableHead>
                    <TableHead className="w-32">Salário Base</TableHead>
                    <TableHead className="w-28">VT Informado</TableHead>
                    <TableHead className="w-28">VR Informado</TableHead>
                    <TableHead className="w-28">Reemb. Creche</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionarios.map((f) => (
                    <TableRow key={f.linha}>
                      <TableCell>
                        <Checkbox
                          checked={f.incluir}
                          onCheckedChange={(checked) =>
                            updateFuncionario(f.linha, { incluir: !!checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={f.nome}
                          onChange={(e) => updateFuncionario(f.linha, { nome: e.target.value })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={f.matricula}
                          onChange={(e) => updateFuncionario(f.linha, { matricula: e.target.value })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={f.cpf}
                          onChange={(e) => updateFuncionario(f.linha, { cpf: e.target.value })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={f.funcao}
                          onChange={(e) => updateFuncionario(f.linha, { funcao: e.target.value })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={f.dataAdmissao}
                          onChange={(e) =>
                            updateFuncionario(f.linha, { dataAdmissao: e.target.value })
                          }
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={f.salarioBase}
                          onChange={(valor) => updateFuncionario(f.linha, { salarioBase: valor })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={f.vtInformado}
                          onChange={(valor) => updateFuncionario(f.linha, { vtInformado: valor })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={f.vrInformado}
                          onChange={(valor) => updateFuncionario(f.linha, { vrInformado: valor })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={f.reembolsoCreche ?? 0}
                          onChange={(valor) => updateFuncionario(f.linha, { reembolsoCreche: valor })}
                          disabled={!f.incluir}
                          className="h-8"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button
                onClick={handleConfirmar}
                disabled={importarFuncionarios.isPending || totalIncluidos === 0}
              >
                <Upload className="size-4" />
                {importarFuncionarios.isPending
                  ? "Importando..."
                  : `Confirmar importação (${totalIncluidos})`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
