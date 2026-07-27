"use client"

import { useState } from "react"
import { ChevronDown, Plus, RefreshCw, ShieldCheck, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"

import {
  usePostosServico,
  useDeletePosto,
  useDeleteEpi,
  useDeleteFerramenta,
  useImportarEpis,
  useUpdatePostoQuantidade,
  type PostoServico,
  type PostoServicoComItens,
} from "@/lib/queries/postos-servico"
import { formatCurrencyBRL } from "@/lib/format"
import { AnalisarPlanilhaDialog } from "@/components/planilha-custo/analisar-planilha-dialog"
import { AnalisarListaSimplesDialog } from "@/components/planilha-custo/analisar-lista-simples-dialog"
import { AdicionarItemDialog } from "@/components/planilha-custo/adicionar-item-dialog"
import { ReimportarPostoDialog } from "@/components/planilha-custo/reimportar-posto-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const modulos = [
  { numero: 1, key: "modulo_1_remuneracao", label: "Módulo 1 — Remuneração" },
  { numero: 2, key: "modulo_2_encargos_beneficios", label: "Módulo 2 — Encargos e Benefícios" },
  { numero: 3, key: "modulo_3_provisao_rescisao", label: "Módulo 3 — Provisão para Rescisão" },
  { numero: 4, key: "modulo_4_reposicao", label: "Módulo 4 — Reposição do Profissional" },
  { numero: 5, key: "modulo_5_insumos", label: "Módulo 5 — Insumos Diversos" },
  {
    numero: 6,
    key: "modulo_6_indiretos_tributos_lucro",
    label: "Módulo 6 — Indiretos, Tributos e Lucro",
  },
] as const

function somaModulos(posto: PostoServico) {
  return (
    posto.modulo_1_remuneracao +
    posto.modulo_2_encargos_beneficios +
    posto.modulo_3_provisao_rescisao +
    posto.modulo_4_reposicao +
    posto.modulo_5_insumos +
    posto.modulo_6_indiretos_tributos_lucro
  )
}

function QuantidadeInput({
  posto,
  contratoId,
  className,
}: {
  posto: PostoServico
  contratoId: string
  className?: string
}) {
  const updateQuantidade = useUpdatePostoQuantidade(contratoId)
  const [valor, setValor] = useState(String(posto.quantidade))

  function commit() {
    const numero = Math.max(1, Math.round(Number(valor) || 1))
    setValor(String(numero))
    if (numero === posto.quantidade) return
    updateQuantidade.mutate(
      { posto, quantidade: numero },
      {
        onSuccess: () => toast.success("Quantidade atualizada"),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Erro ao atualizar"),
      }
    )
  }

  return (
    <Input
      type="number"
      min={1}
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
      }}
      onClick={(e) => e.stopPropagation()}
      className={className ?? "h-8 w-16"}
    />
  )
}

function PostoDetalhe({
  posto,
  contratoId,
  onDeletePosto,
}: {
  posto: PostoServicoComItens
  contratoId: string
  onDeletePosto: (id: string) => void
}) {
  const deleteEpi = useDeleteEpi(contratoId)
  const deleteFerramenta = useDeleteFerramenta(contratoId)
  const importarEpis = useImportarEpis(contratoId, posto.id)
  const subtotal = somaModulos(posto)
  const [moduloAberto, setModuloAberto] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xl font-semibold">
          {formatCurrencyBRL(posto.valor_total)}
        </span>
        <div className="flex items-center gap-2">
          {posto.aba_origem && (
            <ReimportarPostoDialog
              contratoId={contratoId}
              posto={posto}
              trigger={
                <Button variant="outline" size="sm">
                  <RefreshCw className="size-4" /> Atualizar da planilha
                </Button>
              }
            />
          )}
          <Button variant="outline" size="sm" onClick={() => onDeletePosto(posto.id)}>
            <Trash2 className="size-4" /> Excluir posto
          </Button>
        </div>
      </div>

      <div className="flex flex-col divide-y rounded-lg border">
        {modulos.map((m) => {
          const itens = posto.posto_custo_itens.filter((i) => i.modulo === m.numero)
          const aberto = moduloAberto === m.numero
          return (
            <div key={m.key}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left hover:bg-muted/40"
                onClick={() => setModuloAberto(aberto ? null : m.numero)}
              >
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ChevronDown
                    className={`size-3.5 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
                  />
                  {m.label}
                </span>
                <span className="shrink-0 font-mono text-sm">
                  {formatCurrencyBRL(posto[m.key])}
                </span>
              </button>
              {aberto && (
                <div className="flex flex-col gap-1 bg-muted/20 px-3 py-2 pl-9">
                  {itens.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum item detalhado guardado para este módulo (importado
                      antes dessa funcionalidade, ou só o total foi lido da
                      planilha).
                    </p>
                  )}
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 text-xs"
                    >
                      <span className="text-muted-foreground">{item.descricao}</span>
                      <span className="shrink-0 font-mono">
                        {formatCurrencyBRL(item.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div className="flex items-center justify-between gap-4 px-3 py-2">
          <span className="text-sm font-medium">Subtotal por empregado</span>
          <span className="shrink-0 font-mono text-sm font-medium">
            {formatCurrencyBRL(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 px-3 py-2">
          <span className="text-sm font-medium">Quantidade</span>
          <QuantidadeInput posto={posto} contratoId={contratoId} className="h-8 w-16 shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-4 bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">Total do posto</span>
          <span className="shrink-0 font-mono font-semibold">
            {formatCurrencyBRL(posto.valor_total)}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <ShieldCheck className="size-4" /> EPIs
          </span>
          <div className="flex items-center gap-1">
            <AnalisarListaSimplesDialog
              contratoId={contratoId}
              tipoLabel="EPI"
              importarItens={importarEpis}
              trigger={
                <Button variant="ghost" size="sm">
                  Anexar planilha
                </Button>
              }
            />
            <AdicionarItemDialog
              contratoId={contratoId}
              postoServicoId={posto.id}
              tipo="epi"
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <Plus className="size-4" />
                </Button>
              }
            />
          </div>
        </div>
        {posto.posto_epis.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum EPI cadastrado.</p>
        )}
        {posto.posto_epis.map((epi) => (
          <div
            key={epi.id}
            className="flex items-center justify-between rounded-md border px-2 py-1 text-sm"
          >
            <span>
              {epi.nome}
              {epi.quantidade ? ` (x${epi.quantidade})` : ""}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                deleteEpi.mutate(epi.id, { onSuccess: () => toast.success("EPI removido") })
              }
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Wrench className="size-4" /> Ferramentas
          </span>
          <AdicionarItemDialog
            contratoId={contratoId}
            postoServicoId={posto.id}
            tipo="ferramenta"
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Plus className="size-4" />
              </Button>
            }
          />
        </div>
        {posto.ferramentas.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma ferramenta cadastrada.</p>
        )}
        {posto.ferramentas.map((ferramenta) => (
          <div
            key={ferramenta.id}
            className="flex items-center justify-between rounded-md border px-2 py-1 text-sm"
          >
            <span>
              {ferramenta.nome}
              {ferramenta.quantidade ? ` (x${ferramenta.quantidade})` : ""}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                deleteFerramenta.mutate(ferramenta.id, {
                  onSuccess: () => toast.success("Ferramenta removida"),
                })
              }
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PostosServicoList({ contratoId }: { contratoId: string }) {
  const { data: postos, isLoading } = usePostosServico(contratoId)
  const deletePosto = useDeletePosto(contratoId)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [paraExcluir, setParaExcluir] = useState<string | null>(null)

  const custoTotal = (postos ?? []).reduce((acc, p) => acc + p.valor_total, 0)
  const quantidadeTotal = (postos ?? []).reduce((acc, p) => acc + p.quantidade, 0)
  const selecionado = postos?.find((p) => p.id === selecionadoId) ?? null

  async function confirmarExclusao() {
    if (!paraExcluir) return
    try {
      await deletePosto.mutateAsync(paraExcluir)
      toast.success("Posto removido")
      if (selecionadoId === paraExcluir) setSelecionadoId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover posto")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Card className="accent-bar flex-1">
          <CardContent className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="label-caps text-muted-foreground">
                Custo total dos postos
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                Quantidade total: {quantidadeTotal}
              </span>
            </div>
            <span className="font-mono text-xl font-semibold">
              {formatCurrencyBRL(custoTotal)}
            </span>
          </CardContent>
        </Card>
        <AnalisarPlanilhaDialog
          contratoId={contratoId}
          trigger={
            <Button>
              <Plus /> Analisar Planilha
            </Button>
          }
        />
      </div>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {!isLoading && postos?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Nenhum posto de serviço importado ainda. Envie uma planilha de custo na
          aba Documentos e clique em &quot;Analisar Planilha&quot;.
        </p>
      )}

      {!isLoading && (postos?.length ?? 0) > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posto</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>EPIs</TableHead>
                <TableHead>Ferramentas</TableHead>
                <TableHead>Valor total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {postos?.map((posto) => (
                <TableRow
                  key={posto.id}
                  className="cursor-pointer"
                  onClick={() => setSelecionadoId(posto.id)}
                >
                  <TableCell className="font-medium">{posto.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {posto.aba_origem ?? "—"}
                  </TableCell>
                  <TableCell>
                    <QuantidadeInput posto={posto} contratoId={contratoId} />
                  </TableCell>
                  <TableCell>{posto.posto_epis.length}</TableCell>
                  <TableCell>{posto.ferramentas.length}</TableCell>
                  <TableCell className="font-mono font-semibold">
                    {formatCurrencyBRL(posto.valor_total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setParaExcluir(posto.id)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selecionado} onOpenChange={(open) => !open && setSelecionadoId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selecionado?.nome}</SheetTitle>
            <SheetDescription>
              {selecionado?.aba_origem
                ? `Origem: aba "${selecionado.aba_origem}"`
                : "Detalhamento de custo do posto"}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {selecionado && (
              <PostoDetalhe
                posto={selecionado}
                contratoId={contratoId}
                onDeletePosto={(id) => setParaExcluir(id)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!paraExcluir} onOpenChange={(open) => !open && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir posto de serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação remove o posto, seus EPIs e ferramentas cadastrados. Não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
