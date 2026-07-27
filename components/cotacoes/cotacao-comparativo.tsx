"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useAddEmpresa,
  useAddItem,
  useDeleteEmpresa,
  useDeleteItem,
  useSetPreco,
  usePrecos,
  type CotacaoComDetalhes,
} from "@/lib/queries/cotacoes"
import { useDownloadDocumento } from "@/lib/queries/documentos"
import { formatarCnpj } from "@/lib/cnpj"
import { formatCurrencyBRL } from "@/lib/format"
import { AnalisarPdfDialog } from "@/components/cotacoes/analisar-pdf-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function AdicionarItemDialog({ cotacaoId }: { cotacaoId: string }) {
  const [open, setOpen] = useState(false)
  const [descricao, setDescricao] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [unidade, setUnidade] = useState("")
  const addItem = useAddItem(cotacaoId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) {
      toast.error("Informe a descrição")
      return
    }
    try {
      await addItem.mutateAsync({ descricao, quantidade, unidade: unidade || undefined })
      toast.success("Item adicionado")
      setDescricao("")
      setQuantidade(1)
      setUnidade("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar item</DialogTitle>
          <DialogDescription>Produto ou serviço a ser cotado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.valueAsNumber || 1)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Unidade (opcional)</Label>
              <Input
                placeholder="un, cx, kg..."
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addItem.isPending}>
              {addItem.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdicionarEmpresaDialog({ cotacaoId }: { cotacaoId: string }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [contato, setContato] = useState("")
  const addEmpresa = useAddEmpresa(cotacaoId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error("Informe o nome da empresa")
      return
    }
    try {
      await addEmpresa.mutateAsync({ nome, cnpj: cnpj || undefined, contato: contato || undefined })
      toast.success("Empresa adicionada")
      setNome("")
      setCnpj("")
      setContato("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar empresa</DialogTitle>
          <DialogDescription>Empresa que está enviando a cotação.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Nome da empresa</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label>CNPJ (opcional)</Label>
            <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Contato (opcional)</Label>
            <Input value={contato} onChange={(e) => setContato(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addEmpresa.isPending}>
              {addEmpresa.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PrecoInput({
  valorAtual,
  onSalvar,
}: {
  valorAtual: number | null
  onSalvar: (valor: number | null) => void
}) {
  const [valor, setValor] = useState(valorAtual !== null ? String(valorAtual) : "")

  useEffect(() => {
    setValor(valorAtual !== null ? String(valorAtual) : "")
  }, [valorAtual])

  function commit() {
    const numero = valor.trim() === "" ? null : Number(valor)
    onSalvar(numero !== null && !Number.isFinite(numero) ? null : numero)
  }

  return (
    <Input
      type="number"
      step="0.01"
      min={0}
      placeholder="—"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
      }}
      className="h-8 w-28"
    />
  )
}

export function CotacaoComparativo({ cotacao }: { cotacao: CotacaoComDetalhes }) {
  const { data: precos } = usePrecos(cotacao.id)
  const deleteItem = useDeleteItem(cotacao.id)
  const deleteEmpresa = useDeleteEmpresa(cotacao.id)
  const setPreco = useSetPreco(cotacao.id)
  const downloadDocumento = useDownloadDocumento()

  const itens = cotacao.cotacao_itens
  const empresas = cotacao.cotacao_empresas

  async function handleVerPdf(storagePath: string) {
    try {
      const url = await downloadDocumento.mutateAsync(storagePath)
      window.open(url, "_blank")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o PDF")
    }
  }

  const precoMap = useMemo(() => {
    const map = new Map<string, number | null>()
    precos?.forEach((p) => map.set(`${p.cotacao_item_id}_${p.cotacao_empresa_id}`, p.valor_unitario))
    return map
  }, [precos])

  const totalPorEmpresa = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const empresa of empresas) {
      let total = 0
      for (const item of itens) {
        const preco = precoMap.get(`${item.id}_${empresa.id}`)
        if (preco != null) total += preco * item.quantidade
      }
      totals[empresa.id] = total
    }
    return totals
  }, [empresas, itens, precoMap])

  const melhorEmpresaId = useMemo(() => {
    if (itens.length === 0) return null
    let melhor: string | null = null
    let menorValor = Infinity
    for (const empresa of empresas) {
      const completos = itens.every((item) => precoMap.get(`${item.id}_${empresa.id}`) != null)
      if (!completos) continue
      const total = totalPorEmpresa[empresa.id]
      if (total < menorValor) {
        menorValor = total
        melhor = empresa.id
      }
    }
    return melhor
  }, [empresas, itens, precoMap, totalPorEmpresa])

  function menorPrecoDoItem(itemId: string) {
    let menor = Infinity
    for (const empresa of empresas) {
      const preco = precoMap.get(`${itemId}_${empresa.id}`)
      if (preco != null && preco < menor) menor = preco
    }
    return menor === Infinity ? null : menor
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="label-caps text-muted-foreground">Itens ({itens.length})</h2>
          <AdicionarItemDialog cotacaoId={cotacao.id} />
        </div>
        {itens.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum item cadastrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {item.descricao}
                  <span className="ml-2 text-muted-foreground">
                    {item.quantidade} {item.unidade ?? ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    deleteItem.mutate(item.id, { onSuccess: () => toast.success("Item removido") })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="label-caps text-muted-foreground">Empresas ({empresas.length})</h2>
          <div className="flex items-center gap-2">
            <AnalisarPdfDialog
              cotacaoId={cotacao.id}
              itens={itens}
              trigger={
                <Button variant="outline" size="sm">
                  <FileText className="size-4" /> Analisar PDF
                </Button>
              }
            />
            <AdicionarEmpresaDialog cotacaoId={cotacao.id} />
          </div>
        </div>
        {empresas.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma empresa cadastrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span>
                    {empresa.nome}
                    {empresa.contato && (
                      <span className="ml-2 text-muted-foreground">{empresa.contato}</span>
                    )}
                  </span>
                  {(empresa.cnpj || empresa.situacao_cadastral) && (
                    <span className="text-xs text-muted-foreground">
                      {empresa.cnpj && formatarCnpj(empresa.cnpj)}
                      {empresa.situacao_cadastral && ` — ${empresa.situacao_cadastral}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {empresa.documento_storage_path && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Ver PDF da cotação"
                      onClick={() => handleVerPdf(empresa.documento_storage_path!)}
                    >
                      <FileText className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      deleteEmpresa.mutate(empresa.id, {
                        onSuccess: () => toast.success("Empresa removida"),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {itens.length > 0 && empresas.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="label-caps text-muted-foreground">Comparativo de preços</h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">Item</TableHead>
                  {empresas.map((empresa) => (
                    <TableHead key={empresa.id} className="min-w-32">
                      {empresa.nome}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => {
                  const menor = menorPrecoDoItem(item.id)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.descricao}
                        <span className="block text-xs text-muted-foreground">
                          {item.quantidade} {item.unidade ?? ""}
                        </span>
                      </TableCell>
                      {empresas.map((empresa) => {
                        const key = `${item.id}_${empresa.id}`
                        const valor = precoMap.get(key) ?? null
                        const ehMenor = valor !== null && menor !== null && valor === menor
                        return (
                          <TableCell key={empresa.id}>
                            <div className="flex items-center gap-2">
                              <PrecoInput
                                valorAtual={valor}
                                onSalvar={(v) =>
                                  setPreco.mutate({
                                    cotacaoItemId: item.id,
                                    cotacaoEmpresaId: empresa.id,
                                    valorUnitario: v,
                                  })
                                }
                              />
                              {ehMenor && (
                                <span className="text-status-good text-xs font-medium">
                                  menor
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold">Total</TableCell>
                  {empresas.map((empresa) => (
                    <TableCell key={empresa.id}>
                      <div className="flex items-center gap-2 font-mono font-semibold">
                        {formatCurrencyBRL(totalPorEmpresa[empresa.id] ?? 0)}
                        {empresa.id === melhorEmpresaId && (
                          <Badge className="font-sans font-normal">Melhor opção</Badge>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
