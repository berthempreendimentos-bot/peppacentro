"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { UseMutationResult } from "@tanstack/react-query"

import {
  extrairItensSimples,
  lerWorkbook,
  listarAbas,
  type ItemSimples,
} from "@/lib/xlsx/analyze"
import { useDocumentosPlanilha } from "@/lib/queries/postos-servico"
import { useDownloadDocumento } from "@/lib/queries/documentos"
import { formatCurrencyBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

type Etapa = "arquivo" | "abas" | "revisar"

export function AnalisarListaSimplesDialog({
  trigger,
  contratoId,
  tipoLabel,
  importarItens,
}: {
  trigger: React.ReactNode
  contratoId: string
  tipoLabel: string
  importarItens: UseMutationResult<
    void,
    Error,
    { documentoId: string; abaOrigem: string; itens: ItemSimples[] }
  >
}) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("arquivo")
  const { data: documentos } = useDocumentosPlanilha(contratoId)
  const downloadDocumento = useDownloadDocumento()

  const [documentoId, setDocumentoId] = useState("")
  const [workbook, setWorkbook] = useState<ReturnType<typeof lerWorkbook> | null>(null)
  const [abasDisponiveis, setAbasDisponiveis] = useState<string[]>([])
  const [abaEscolhida, setAbaEscolhida] = useState<string | null>(null)
  const [itens, setItens] = useState<ItemSimples[]>([])
  const [carregando, setCarregando] = useState(false)

  function resetTudo() {
    setEtapa("arquivo")
    setDocumentoId("")
    setWorkbook(null)
    setAbasDisponiveis([])
    setAbaEscolhida(null)
    setItens([])
  }

  async function handleEscolherArquivo() {
    const documento = documentos?.find((d) => d.id === documentoId)
    if (!documento) {
      toast.error("Selecione uma planilha")
      return
    }
    setCarregando(true)
    try {
      const url = await downloadDocumento.mutateAsync(documento.storage_path)
      const resposta = await fetch(url)
      const bytes = await resposta.arrayBuffer()
      const wb = lerWorkbook(bytes)
      setWorkbook(wb)
      setAbasDisponiveis(listarAbas(wb))
      setEtapa("abas")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha")
    } finally {
      setCarregando(false)
    }
  }

  function handleEscolherAba(aba: string) {
    if (!workbook) return
    setAbaEscolhida(aba)
    setItens(extrairItensSimples(workbook, aba))
    setEtapa("revisar")
  }

  async function handleConfirmar() {
    if (!abaEscolhida) return
    try {
      await importarItens.mutateAsync({
        documentoId,
        abaOrigem: abaEscolhida,
        itens,
      })
      toast.success(`${tipoLabel} importado(s)`)
      setOpen(false)
      resetTudo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar")
    }
  }

  function updateItem(linha: number, patch: Partial<ItemSimples>) {
    setItens((prev) => prev.map((i) => (i.linha === linha ? { ...i, ...patch } : i)))
  }

  const totalPreview = itens
    .filter((i) => i.incluir)
    .reduce((acc, i) => acc + (i.valor ?? 0) * (i.quantidade ?? 1), 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetTudo()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analisar planilha de {tipoLabel.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Escolha uma planilha enviada em Documentos e a aba com a lista de{" "}
            {tipoLabel.toLowerCase()} (nome + valor).
          </DialogDescription>
        </DialogHeader>

        {etapa === "arquivo" && (
          <div className="flex flex-col gap-4">
            {documentos?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhuma planilha de custo enviada ainda. Envie uma na aba Documentos
                com a categoria &quot;Planilha de Custo&quot;.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Planilha</Label>
                <Select value={documentoId} onValueChange={setDocumentoId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a planilha" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentos?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEscolherArquivo} disabled={!documentoId || carregando}>
                {carregando ? "Lendo planilha..." : "Continuar"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {etapa === "abas" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Aba com a lista de {tipoLabel.toLowerCase()}</Label>
              <Select value={abaEscolhida ?? ""} onValueChange={handleEscolherAba}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a aba" />
                </SelectTrigger>
                <SelectContent>
                  {abasDisponiveis.map((aba) => (
                    <SelectItem key={aba} value={aba}>
                      {aba}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {etapa === "revisar" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Aba <span className="font-medium">{abaEscolhida}</span> — desmarque o
              que não deve entrar na lista e ajuste nome/valor se precisar.
            </p>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-24">Qtd.</TableHead>
                    <TableHead className="w-32">Valor</TableHead>
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
                          value={item.descricao}
                          onChange={(e) =>
                            updateItem(item.linha, { descricao: e.target.value })
                          }
                          disabled={!item.incluir}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantidade ?? 1}
                          onChange={(e) =>
                            updateItem(item.linha, {
                              quantidade: e.target.valueAsNumber || 1,
                            })
                          }
                          disabled={!item.incluir}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor ?? 0}
                          onChange={(e) =>
                            updateItem(item.linha, { valor: e.target.valueAsNumber || 0 })
                          }
                          disabled={!item.incluir}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {itens.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Nenhum item com valor foi encontrado nesta aba.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Total de {tipoLabel.toLowerCase()} a importar
              </span>
              <span className="font-mono text-lg font-semibold">
                {formatCurrencyBRL(totalPreview)}
              </span>
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmar} disabled={importarItens.isPending}>
                {importarItens.isPending ? "Importando..." : "Confirmar importação"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
