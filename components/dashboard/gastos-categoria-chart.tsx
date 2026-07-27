"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useGastosPorCategoria } from "@/lib/queries/dashboard"
import { formatCurrencyBRL } from "@/lib/format"
import { CATEGORICAL_COLORS } from "@/lib/chart-colors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function GastosPorCategoriaChart() {
  const { data, isLoading } = useGastosPorCategoria()

  const top = (data ?? []).slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : top.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Sem dados suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <PieChart>
              <Pie
                data={top}
                dataKey="total"
                nameKey="categoria"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {top.map((_, index) => (
                  <Cell key={index} fill={CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
