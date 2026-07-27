"use client"

import { useState } from "react"
import { FileText, Upload } from "lucide-react"
import { toast } from "sonner"

import { formatarCnpj } from "@/lib/cnpj"
import { extrairItensCandidatos, sugerirPrecos } from "@/lib/cotacao-pdf"
import { useAddEmpresaComPdf, type CotacaoEmpresa, type CotacaoItem } from "@/lib/queries/cotacoes"
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

type PrecoLinha = { incluir: boolean; valor: number | "" }
type ItemCandidato = { incluir: boolean; descricao: string; valor: number | "" }

export function AnalisarPdfDialog({
  cotacaoId,
  itens,
  empresas,
  trigger,
}: {
  cotacaoId: string
  itens: CotacaoItem[]
  empresas: CotacaoEmpresa[]
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<Etapa>("arquivo")
  const [file, setFile] = useState<File | null>(null)
  const [carregando, setCarregando] = useState(false)

  const [cnpj, setCnpj] = useState("")
  const [nome, setNome] = useState("")
  const [razaoSocial, setRazaoSocial] = useState("")
  const [situacao, setSituacao] = useState("")
  const [endereco, setEndereco] = useState("")
  const [precos, setPrecos] = useState<Record<string, PrecoLinha>>({})
  const [itensCandidatos, setItensCandidatos] = useState<ItemCandidato[]>([])

  const criarEmpresa = useAddEmpresaComPdf(cotacaoId)

  function resetTudo() {
    setEtapa("arquivo")
    setFile(null)
    setCnpj("")
    setNome("")
    setRazaoSocial("")
    setSituacao("")
    setEndereco("")
    setPrecos({})
    setItensCandidatos([])
  }

  async function handleAnalisar() {
    if (!file) {
      toast.error("Selecione um arquivo PDF")
      return
    }

    // Validar arquivo duplicado
    const arquivoJaAnexado = empresas.some(e => e.documento_storage_path?.includes(file.name.replace(/[^\w.\-]+/g, "_")))
    if (arquivoJaAnexado) {
      toast.error("Este arquivo PDF já foi anexado nesta cotação.")
      return
    }

    setCarregando(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const resposta = await fetch("/api/cotacoes/analisar-pdf", {
        method: "POST",
        body: formData,
      })
      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => null)
        throw new Error(erro?.error ?? "Não foi possível analisar o PDF")
      }
      const dados = await resposta.json()

      if (dados.cnpj) {
        // Validar CNPJ duplicado
        if (empresas.some(e => e.cnpj === dados.cnpj)) {
          toast.error("Uma cotação com este CNPJ já foi adicionada ao comparativo.")
          setCarregando(false)
          return
        }
        setCnpj(dados.cnpj)
      }
      
      if (dados.empresa) {
        setRazaoSocial(dados.empresa.razaoSocial ?? "")
        setNome(dados.empresa.nomeFantasia || dados.empresa.razaoSocial || "")
        setSituacao(dados.empresa.situacaoCadastral ?? "")
        setEndereco(dados.empresa.endereco ?? "")
      }

      const sugestoes = sugerirPrecos(dados.texto ?? "", itens)
      const novo: Record<string, PrecoLinha> = {}
      for (const item of itens) {
        const valor = sugestoes[item.id]
        novo[item.id] = { incluir: valor !== null, valor: valor ?? "" }
      }
      setPrecos(novo)

      const jaExistem = new Set(itens.map((item) => item.descricao.trim().toLowerCase()))
      const candidatos = extrairItensCandidatos(dados.texto ?? "").filter(
        (c) => !jaExistem.has(c.descricao.trim().toLowerCase())
      )
      setItensCandidatos(
        candidatos.map((c) => ({ incluir: true, descricao: c.descricao, valor: c.valor }))
      )

      setEtapa("revisar")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível analisar o PDF"))
    } finally {
      setCarregando(false)
    }
  }

  function updatePreco(itemId: string, patch: Partial<PrecoLinha>) {
    setPrecos((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
  }

  function updateItemCandidato(index: number, patch: Partial<ItemCandidato>) {
    setItensCandidatos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    )
  }

  async function handleConfirmar() {
    if (!nome.trim()) {
      toast.error("Informe o nome da empresa")
      return
    }
    if (!file) return
    try {
      await criarEmpresa.mutateAsync({
        file,
        nome,
        cnpj: cnpj || undefined,
        razaoSocial: razaoSocial || undefined,
        situacaoCadastral: situacao || undefined,
        endereco: endereco || undefined,
        precos: Object.entries(precos)
          .filter(([, v]) => v.incluir && v.valor !== "")
          .map(([itemId, v]) => ({ cotacaoItemId: itemId, valorUnitario: Number(v.valor) })),
        novosItens: itensCandidatos
          .filter((item) => item.incluir && item.descricao.trim() && item.valor !== "")
          .map((item) => ({ descricao: item.descricao.trim(), valorUnitario: Number(item.valor) })),
      })
      toast.success("Empresa e preços importados")
      setOpen(false)
      resetTudo()
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar"))
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Analisar cotação em PDF</DialogTitle>
          <DialogDescription>
            CNPJ, itens e preços são identificados automaticamente a partir do PDF.
          </DialogDescription>
        </DialogHeader>

        {etapa === "arquivo" && (
          <div className="flex flex-col gap-4">
            {itens.length === 0 && (
              <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                Esta cotação ainda não tem itens cadastrados — o sistema vai tentar
                detectar os itens e preços direto na tabela do PDF.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label>Arquivo PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAnalisar} disabled={!file || carregando}>
                <Upload className="size-4" />
                {carregando ? "Analisando..." : "Analisar"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {etapa === "revisar" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {cnpj ? (
                  <span>
                    CNPJ identificado: <span className="font-mono">{formatarCnpj(cnpj)}</span>
                    {situacao && ` — ${situacao}`}
                    {razaoSocial && (
                      <span className="block text-xs text-muted-foreground">
                        {razaoSocial}
                        {endereco && ` · ${endereco}`}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    CNPJ não identificado automaticamente. Preencha manualmente se desejar.
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="label-caps text-muted-foreground">Nome da empresa</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="label-caps text-muted-foreground">CNPJ</Label>
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {(itensCandidatos.length > 0 || itens.length > 0) && (
              <div className="grid gap-3 md:grid-cols-2">
                {itensCandidatos.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="label-caps text-muted-foreground">
                      Itens detectados na proposta
                    </Label>
                    <div className="max-h-56 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8" />
                            <TableHead>Descrição</TableHead>
                            <TableHead className="w-32">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itensCandidatos.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Checkbox
                                  checked={item.incluir}
                                  onCheckedChange={(checked) =>
                                    updateItemCandidato(index, { incluir: !!checked })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.descricao}
                                  onChange={(e) =>
                                    updateItemCandidato(index, { descricao: e.target.value })
                                  }
                                  disabled={!item.incluir}
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <CurrencyInput
                                  value={item.valor === "" ? 0 : item.valor}
                                  onChange={(valor) => updateItemCandidato(index, { valor })}
                                  disabled={!item.incluir}
                                  className="h-8 text-right"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {itens.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="label-caps text-muted-foreground">
                      Itens e preços sugeridos
                    </Label>
                    <div className="max-h-56 overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8" />
                            <TableHead>Item</TableHead>
                            <TableHead className="w-32">Preço</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itens.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Checkbox
                                  checked={precos[item.id]?.incluir ?? false}
                                  onCheckedChange={(checked) =>
                                    updatePreco(item.id, { incluir: !!checked })
                                  }
                                />
                              </TableCell>
                              <TableCell className="max-w-64 whitespace-normal break-words">
                                {item.descricao}
                              </TableCell>
                              <TableCell>
                                <CurrencyInput
                                  value={
                                    precos[item.id]?.valor === "" || precos[item.id]?.valor == null
                                      ? 0
                                      : Number(precos[item.id].valor)
                                  }
                                  onChange={(valor) => updatePreco(item.id, { valor })}
                                  className="h-8 text-right"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleConfirmar} disabled={criarEmpresa.isPending}>
                {criarEmpresa.isPending ? "Salvando..." : "Salvar empresa e preços"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
