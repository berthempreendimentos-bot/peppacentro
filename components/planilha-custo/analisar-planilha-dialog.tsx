"use client"

import { useState } from "react"
import { toast } from "sonner"

import {
  extrairLinhas,
  lerWorkbook,
  listarAbas,
  type LinhaCategoria,
  type LinhaPlanilha,
} from "@/lib/xlsx/analyze"
import {
  useDocumentosPlanilha,
  useImportarPosto,
  usePostosServico,
} from "@/lib/queries/postos-servico"
import { useDownloadDocumento } from "@/lib/queries/documentos"
import { ClassificarLinhasTable } from "@/components/planilha-custo/classificar-linhas-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

type Etapa = "arquivo" | "abas" | "classificar"

export function AnalisarPlanilhaDialog({
  trigger,
  contratoId,
}: {
  trigger: React.ReactNode
  contratoId: string
}) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("arquivo")
  const { data: documentos } = useDocumentosPlanilha(contratoId)
  const { data: postosExistentes } = usePostosServico(contratoId)
  const downloadDocumento = useDownloadDocumento()
  const importarPosto = useImportarPosto(contratoId)

  const abasJaImportadas = new Set(
    (postosExistentes ?? []).map((p) => p.aba_origem).filter((a): a is string => !!a)
  )

  const [documentoId, setDocumentoId] = useState<string>("")
  const [workbook, setWorkbook] = useState<ReturnType<typeof lerWorkbook> | null>(null)
  const [abasDisponiveis, setAbasDisponiveis] = useState<string[]>([])
  const [abasSelecionadas, setAbasSelecionadas] = useState<string[]>([])
  const [fila, setFila] = useState<string[]>([])
  const [abaAtual, setAbaAtual] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([])
  const [nomePosto, setNomePosto] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [carregando, setCarregando] = useState(false)

  function resetTudo() {
    setEtapa("arquivo")
    setDocumentoId("")
    setWorkbook(null)
    setAbasDisponiveis([])
    setAbasSelecionadas([])
    setFila([])
    setAbaAtual(null)
    setLinhas([])
    setNomePosto("")
    setQuantidade(1)
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

  function iniciarClassificacao(aba: string, restantes: string[]) {
    if (!workbook) return
    setAbaAtual(aba)
    setFila(restantes)
    setNomePosto(aba)
    setQuantidade(1)
    setLinhas(extrairLinhas(workbook, aba))
    setEtapa("classificar")
  }

  function handleConfirmarAbas() {
    if (abasSelecionadas.length === 0) {
      toast.error("Marque ao menos uma aba como posto de serviço")
      return
    }
    const [primeira, ...restantes] = abasSelecionadas
    iniciarClassificacao(primeira, restantes)
  }

  async function handleConfirmarPosto() {
    if (!abaAtual) return
    try {
      await importarPosto.mutateAsync({
        nome: nomePosto,
        quantidade,
        documentoId,
        abaOrigem: abaAtual,
        linhas,
      })
      toast.success(`Posto "${nomePosto}" importado`)
      if (fila.length > 0) {
        const [proxima, ...restantes] = fila
        iniciarClassificacao(proxima, restantes)
      } else {
        toast.message("Importação concluída")
        setOpen(false)
        resetTudo()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar o posto")
    }
  }

  function updateLinha(linha: number, categoria: LinhaCategoria) {
    setLinhas((prev) => prev.map((l) => (l.linha === linha ? { ...l, categoria } : l)))
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analisar planilha de custo</DialogTitle>
          <DialogDescription>
            Escolha uma planilha enviada em Documentos, selecione as abas que
            representam postos de serviço (dá para acrescentar só abas novas às
            já importadas) e classifique os custos de cada uma.
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
            <p className="text-sm text-muted-foreground">
              Marque quais abas representam postos de serviço. Você pode selecionar
              só as abas novas para acrescentar aos postos já importados.
            </p>
            <div className="flex flex-col gap-2">
              {abasDisponiveis.map((aba) => {
                const jaImportada = abasJaImportadas.has(aba)
                return (
                  <label
                    key={aba}
                    className={`flex items-center gap-2 text-sm ${
                      jaImportada ? "text-muted-foreground" : ""
                    }`}
                  >
                    <Checkbox
                      disabled={jaImportada}
                      checked={jaImportada || abasSelecionadas.includes(aba)}
                      onCheckedChange={(checked) =>
                        setAbasSelecionadas((prev) =>
                          checked ? [...prev, aba] : prev.filter((a) => a !== aba)
                        )
                      }
                    />
                    {aba}
                    {jaImportada && (
                      <Badge variant="outline" className="text-[10px]">
                        já importado
                      </Badge>
                    )}
                  </label>
                )
              })}
            </div>
            <DialogFooter>
              <Button onClick={handleConfirmarAbas}>Continuar</Button>
            </DialogFooter>
          </div>
        )}

        {etapa === "classificar" && abaAtual && (
          <div className="flex flex-col gap-4">
            <ClassificarLinhasTable
              aba={abaAtual}
              nomePosto={nomePosto}
              onNomePostoChange={setNomePosto}
              quantidade={quantidade}
              onQuantidadeChange={setQuantidade}
              linhas={linhas}
              onLinhaCategoriaChange={updateLinha}
            />
            <DialogFooter>
              <Button onClick={handleConfirmarPosto} disabled={importarPosto.isPending}>
                {importarPosto.isPending
                  ? "Importando..."
                  : fila.length > 0
                    ? "Confirmar e ir para a próxima aba"
                    : "Confirmar importação"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
