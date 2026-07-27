"use client"

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useSituacaoContratos } from "@/lib/queries/dashboard"
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from "@/lib/chart-colors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const situacaoLabel: Record<string, string> = {
  em_andamento: "Em andamento",
  executado: "Executado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  inicializacao: "Inicialização",
}

const situacaoColor: Record<string, string> = {
  em_andamento: "var(--chart-1)",
  executado: "var(--status-good)",
  encerrado: "var(--chart-6)",
  cancelado: "var(--status-critical)",
  inicializacao: "var(--chart-2)",
}

export function SituacaoContratosChart() {
  const { data, isLoading } = useSituacaoContratos()

  const chartData = (data ?? []).map((d) => ({
    situacao: situacaoLabel[d.situacao] ?? d.situacao,
    key: d.situacao,
    total: d.total,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Situação dos Contratos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} stroke={CHART_GRID_COLOR} />
              <XAxis type="number" allowDecimals={false} stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="situacao"
                stroke={CHART_AXIS_COLOR}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={situacaoColor[entry.key] ?? "var(--chart-1)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
