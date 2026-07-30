"use client"

import { useState } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"

import { extrairAso, lerWorkbookAso, type AsoImportado } from "@/lib/xlsx/aso-import"
import { useFuncionarios } from "@/lib/queries/funcionarios"
import { useImportOcorrenciasAso } from "@/lib/queries/ocorrencias"
import { getErrorMessage } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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

export function ImportarAsoDialog({
  contratoId,
  mesReferencia,
  trigger,
}: {
  contratoId: string
  mesReferencia: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("arquivo")
  const [carregando, setCarregando] = useState(false)
  const [itens, setItens] = useState<AsoImportado[]>([])
  const { data: funcionarios } = useFuncionarios(contratoId)
  const importarAso = useImportOcorrenciasAso(contratoId, mesReferencia)

  function resetTudo() {
    setEtapa("arquivo")
    setItens([])
  }

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCarregando(true)
    try {
      const bytes = await file.arrayBuffer()
      const workbook = lerWorkbookAso(bytes)
      const extraidos = extrairAso(workbook, funcionarios ?? [])
      if (extraidos.length === 0) {
        toast.error('Nenhum registro encontrado — confira se a coluna "Nome" está preenchida')
        return
      }
      setItens(extraidos)
      setEtapa("revisar")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível ler a planilha"))
    } finally {
      setCarregando(false)
      e.target.value = ""
    }
  }

  function updateItem(linha: number, patch: Partial<AsoImportado>) {
    setItens((prev) => prev.map((i) => (i.linha === linha ? { ...i, ...patch } : i)))
  }

  const semFuncionario = itens.filter((i) => i.incluir && !i.funcionarioId).length
  const podeConfirmar = itens.some((i) => i.incluir && i.funcionarioId && i.valor > 0)

  async function handleConfirmar() {
    try {
      const selecionados = itens
        .filter((i) => i.incluir && i.funcionarioId && i.valor > 0)
        .map((i) => ({ funcionarioId: i.funcionarioId as string, valor: i.valor }))
      await importarAso.mutateAsync(selecionados)
      toast.success("ASO importado para os funcionários")
      setOpen(false)
      resetTudo()
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível importar o ASO"))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetTudo()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar ASO de uma planilha</DialogTitle>
          <DialogDescription>
            Colunas reconhecidas: Nome, CPF e Valor. Cada linha vira um lançamento de
            &ldquo;Atestado de Saúde Ocupacional (ASO)&rdquo; para o funcionário correspondente, no
            mês {mesReferencia}.
          </DialogDescription>
        </DialogHeader>

        {etapa === "arquivo" && (
          <div className="flex flex-col gap-4">
            <a
              href="/api/funcionarios/aso-template"
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
              {semFuncionario > 0 && (
                <span className="text-destructive">
                  {" "}
                  {semFuncionario} linha(s) sem funcionário correspondente não serão importadas.
                </span>
              )}
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead className="w-32">Valor</TableHead>
                    <TableHead>Funcionário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.linha}>
                      <TableCell>
                        <Checkbox
                          checked={item.incluir}
                          onCheckedChange={(checked) =>
                            updateItem(item.linha, { incluir: !!checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.nome}
                          onChange={(e) => updateItem(item.linha, { nome: e.target.value })}
                          disabled={!item.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.cpf}
                          onChange={(e) => updateItem(item.linha, { cpf: e.target.value })}
                          disabled={!item.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={item.valor}
                          onChange={(valor) => updateItem(item.linha, { valor })}
                          disabled={!item.incluir}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        {item.funcionarioId ? (
                          <Badge variant="secondary">Encontrado</Badge>
                        ) : (
                          <Badge variant="destructive">Não encontrado</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmar} disabled={importarAso.isPending || !podeConfirmar}>
                <Upload className="size-4" />
                {importarAso.isPending ? "Importando..." : "Confirmar importação"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
