import { formatCurrencyBRL, formatDate } from "@/lib/format"
import type { useContrato } from "@/lib/queries/contratos"
import { Card, CardContent } from "@/components/ui/card"

type ContratoDetalhado = NonNullable<ReturnType<typeof useContrato>["data"]>

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  )
}

export function ContratoDados({ contrato }: { contrato: ContratoDetalhado }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Número" value={contrato.numero} />
        <Campo label="Cliente" value={contrato.clientes?.nome} />
        <Campo label="Empresa" value={contrato.empresa} />
        <Campo label="Tipo" value={contrato.tipo} />
        <Campo label="Fonte de recurso" value={contrato.fonte_recurso} />
        <Campo label="Valor inicial" value={formatCurrencyBRL(contrato.valor_inicial)} />
        <Campo label="Valor atual" value={formatCurrencyBRL(contrato.valor_atual)} />
        <Campo label="Data de assinatura" value={formatDate(contrato.data_assinatura)} />
        <Campo label="Início" value={formatDate(contrato.data_inicio)} />
        <Campo label="Fim" value={formatDate(contrato.data_fim)} />
        <Campo label="Gestor" value={contrato.gestor?.nome} />
        <Campo label="Fiscal" value={contrato.fiscal?.nome} />
        <div className="sm:col-span-2 lg:col-span-3">
          <Campo label="Objeto" value={contrato.objeto} />
        </div>
      </CardContent>
    </Card>
  )
}
