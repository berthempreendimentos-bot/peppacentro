"use client"

import {
  Wallet,
  TrendingUp,
  Scale,
  FileText,
  ClipboardList,
  FolderOpen,
  CalendarClock,
  Users,
} from "lucide-react"

import { useDashboardKpis, useDashboardTotalPostos } from "@/lib/queries/dashboard"
import { formatCurrencyBRL } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
}) {
  return (
    <Card className="accent-bar">
      <CardContent className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <p className="label-caps text-muted-foreground">{label}</p>
          <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

export function KpiCards() {
  const { data: kpis, isLoading: isLoadingKpis } = useDashboardKpis()
  const { data: totalPostos, isLoading: isLoadingPostos } = useDashboardTotalPostos()

  const isLoading = isLoadingKpis || isLoadingPostos

  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Contratos Ativos" value={kpis.contratos_ativos} icon={FileText} />
      <KpiCard label="Total de Postos" value={totalPostos ?? 0} icon={Users} />
      <KpiCard label="Valor Total" value={formatCurrencyBRL(kpis.valor_total)} icon={Wallet} />
      <KpiCard label="Executado" value={formatCurrencyBRL(kpis.executado)} icon={TrendingUp} />
      <KpiCard label="Saldo" value={formatCurrencyBRL(kpis.saldo)} icon={Scale} />
      <KpiCard
        label="Medições Pendentes"
        value={kpis.medicoes_pendentes}
        icon={ClipboardList}
      />
      <KpiCard
        label="Documentos Pendentes"
        value={kpis.documentos_pendentes}
        icon={FolderOpen}
      />
      <KpiCard
        label="Contratos Próx. Vencimento"
        value={kpis.contratos_proximos_vencimento}
        icon={CalendarClock}
      />
    </div>
  )
}
