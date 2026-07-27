"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useContratosPorCliente } from "@/lib/queries/dashboard"
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from "@/lib/chart-colors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ContratosPorClienteChart() {
  const { data, isLoading } = useContratosPorCliente()

  const chartData = (data ?? []).slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contratos por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
              <XAxis
                dataKey="cliente"
                stroke={CHART_AXIS_COLOR}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                allowDecimals={false}
                stroke={CHART_AXIS_COLOR}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={30}
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
              <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
