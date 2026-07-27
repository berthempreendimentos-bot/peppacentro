"use client"

import { useEffect } from "react"
import { usePostosServico } from "@/lib/queries/postos-servico"
import {
  useAdicionarFerramentaContrato,
  useExcluirFerramentaContrato,
  useFerramentasContrato,
  useImportarFerramentasContrato,
} from "@/lib/queries/ferramentas-contrato"
import {
  useAdicionarServicoContrato,
  useExcluirServicoContrato,
  useImportarServicosContrato,
  useServicosContrato,
} from "@/lib/queries/servicos-contrato"
import { useUpdateValorContrato } from "@/lib/queries/contratos"
import { formatCurrencyBRL } from "@/lib/format"
import { PostosServicoList } from "@/components/planilha-custo/postos-servico-list"
import { ItemListaContratoSection } from "@/components/planilha-custo/item-lista-contrato-section"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function PlanilhaCustoTab({ contratoId }: { contratoId: string }) {
  const { data: postos, isLoading: carregandoPostos } = usePostosServico(contratoId)
  const { data: ferramentas, isLoading: carregandoFerramentas } =
    useFerramentasContrato(contratoId)
  const { data: servicos, isLoading: carregandoServicos } = useServicosContrato(contratoId)

  const adicionarFerramenta = useAdicionarFerramentaContrato(contratoId)
  const excluirFerramenta = useExcluirFerramentaContrato(contratoId)
  const importarFerramentas = useImportarFerramentasContrato(contratoId)

  const adicionarServico = useAdicionarServicoContrato(contratoId)
  const excluirServico = useExcluirServicoContrato(contratoId)
  const importarServicos = useImportarServicosContrato(contratoId)

  const totalPostos = (postos ?? []).reduce((acc, p) => acc + p.valor_total, 0)
  const totalFerramentas = (ferramentas ?? []).reduce((acc, f) => acc + f.valor_total, 0)
  const totalServicos = (servicos ?? []).reduce((acc, s) => acc + s.valor_total, 0)
  const totalMensal = totalPostos + totalFerramentas + totalServicos
  const totalAnual = totalMensal * 12

  const { mutate: updateValor } = useUpdateValorContrato()

  useEffect(() => {
    if (carregandoPostos || carregandoFerramentas || carregandoServicos) return
    if (!postos || !ferramentas || !servicos) return

    updateValor(
      { id: contratoId, valor: totalAnual },
      {
        onError: () => toast.error("Erro ao atualizar o valor do contrato automaticamente.")
      }
    )
  }, [
    totalAnual,
    contratoId,
    carregandoPostos,
    carregandoFerramentas,
    carregandoServicos,
    postos,
    ferramentas,
    servicos,
    updateValor,
  ])

  return (
    <div className="flex flex-col gap-8">
      <Card className="accent-bar">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Custo por Posto</span>
            <span className="font-mono">{formatCurrencyBRL(totalPostos)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Custo Ferramentas</span>
            <span className="font-mono">{formatCurrencyBRL(totalFerramentas)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Custo Serviços</span>
            <span className="font-mono">{formatCurrencyBRL(totalServicos)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="label-caps text-muted-foreground">Total Geral (Mensal)</span>
            <span className="font-mono text-2xl font-bold">
              {formatCurrencyBRL(totalMensal)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
            <span className="label-caps text-muted-foreground">Valor Anual</span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-2xl font-bold text-primary">
                {formatCurrencyBRL(totalAnual)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Custo por Posto</h2>
        <PostosServicoList contratoId={contratoId} />
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Custo Ferramentas</h2>
        <ItemListaContratoSection
          contratoId={contratoId}
          titulo="Custo total de ferramentas"
          tipoLabel="Ferramenta"
          itens={ferramentas}
          isLoading={carregandoFerramentas}
          onAdicionar={adicionarFerramenta}
          onExcluir={excluirFerramenta}
          importarItens={importarFerramentas}
        />
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 font-heading text-lg font-semibold">Custo Serviços</h2>
        <ItemListaContratoSection
          contratoId={contratoId}
          titulo="Custo total de serviços"
          tipoLabel="Serviço"
          itens={servicos}
          isLoading={carregandoServicos}
          onAdicionar={adicionarServico}
          onExcluir={excluirServico}
          importarItens={importarServicos}
        />
      </div>
    </div>
  )
}
