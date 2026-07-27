"use client"

import { useState } from "react"
import { toast } from "sonner"

import { extrairLinhas, lerWorkbook, type LinhaCategoria, type LinhaPlanilha } from "@/lib/xlsx/analyze"
import {
  useDocumentosPlanilha,
  useReimportarPosto,
  type PostoServico,
} from "@/lib/queries/postos-servico"
import { useDownloadDocumento } from "@/lib/queries/documentos"
import { ClassificarLinhasTable } from "@/components/planilha-custo/classificar-linhas-table"
import { Button } from "@/components/ui/button"
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

export function ReimportarPostoDialog({
  trigger,
  contratoId,
  posto,
}: {
  trigger: React.ReactNode
  contratoId: string
  posto: PostoServico
}) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<"arquivo" | "classificar">("arquivo")
  const { data: documentos } = useDocumentosPlanilha(contratoId)
  const downloadDocumento = useDownloadDocumento()
  const reimportarPosto = useReimportarPosto(contratoId)

  const [documentoId, setDocumentoId] = useState<string>(posto.documento_id ?? "")
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([])
  const [nomePosto, setNomePosto] = useState(posto.nome)
  const [quantidade, setQuantidade] = useState(posto.quantidade)
  const [carregando, setCarregando] = useState(false)

  function resetTudo() {
    setEtapa("arquivo")
    setDocumentoId(posto.documento_id ?? "")
    setLinhas([])
    setNomePosto(posto.nome)
    setQuantidade(posto.quantidade)
  }

  async function handleEscolherArquivo() {
    const documento = documentos?.find((d) => d.id === documentoId)
    if (!documento) {
      toast.error("Selecione uma planilha")
      return
    }
    if (!posto.aba_origem) {
      toast.error("Este posto não tem uma aba de origem registrada")
      return
    }
    setCarregando(true)
    try {
      const url = await downloadDocumento.mutateAsync(documento.storage_path)
      const resposta = await fetch(url)
      const bytes = await resposta.arrayBuffer()
      const wb = lerWorkbook(bytes)
      setLinhas(extrairLinhas(wb, posto.aba_origem))
      setEtapa("classificar")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha")
    } finally {
      setCarregando(false)
    }
  }

  function updateLinha(linha: number, categoria: LinhaCategoria) {
    setLinhas((prev) => prev.map((l) => (l.linha === linha ? { ...l, categoria } : l)))
  }

  async function handleConfirmar() {
    try {
      await reimportarPosto.mutateAsync({
        postoId: posto.id,
        nome: nomePosto,
        quantidade,
        documentoId,
        abaOrigem: posto.aba_origem ?? nomePosto,
        linhas,
      })
      toast.success(`Posto "${nomePosto}" atualizado`)
      setOpen(false)
      resetTudo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o posto")
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Atualizar detalhamento da planilha</DialogTitle>
          <DialogDescription>
            Reclassifica as linhas da aba &quot;{posto.aba_origem}&quot; e guarda os
            itens de cada módulo, sem criar um novo posto. EPIs e ferramentas já
            cadastrados não são afetados.
          </DialogDescription>
        </DialogHeader>

        {etapa === "arquivo" && (
          <div className="flex flex-col gap-4">
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
            <DialogFooter>
              <Button onClick={handleEscolherArquivo} disabled={!documentoId || carregando}>
                {carregando ? "Lendo planilha..." : "Continuar"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {etapa === "classificar" && (
          <div className="flex flex-col gap-4">
            <ClassificarLinhasTable
              aba={posto.aba_origem ?? nomePosto}
              nomePosto={nomePosto}
              onNomePostoChange={setNomePosto}
              quantidade={quantidade}
              onQuantidadeChange={setQuantidade}
              linhas={linhas}
              onLinhaCategoriaChange={updateLinha}
            />
            <DialogFooter>
              <Button onClick={handleConfirmar} disabled={reimportarPosto.isPending}>
                {reimportarPosto.isPending ? "Atualizando..." : "Confirmar atualização"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
