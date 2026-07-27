"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useFinanceiroMensal } from "@/lib/queries/dashboard"
import { formatCurrencyBRL, formatDateShort } from "@/lib/format"
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from "@/lib/chart-colors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function EvolucaoFinanceiraChart() {
  const { data, isLoading } = useFinanceiroMensal()

  const chartData = (data ?? []).map((d) => ({
    mes: formatDateShort(d.mes),
    Receitas: d.receitas ?? 0,
    Despesas: d.despesas ?? 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Financeira</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
              <XAxis
                dataKey="mes"
                stroke={CHART_AXIS_COLOR}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={CHART_AXIS_COLOR}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrencyBRL(v)}
                width={90}
              />
              <Tooltip
                formatter={(value) => formatCurrencyBRL(Number(value) || 0)}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Receitas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Despesas" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
