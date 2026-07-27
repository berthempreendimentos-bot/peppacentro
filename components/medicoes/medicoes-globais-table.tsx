"use client"

import Link from "next/link"

import { useMedicoesGlobal } from "@/lib/queries/medicoes"
import { medicaoStatusOptions } from "@/lib/validations/medicoes"
import { formatCurrencyBRL, formatDateShort } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusLabel = Object.fromEntries(medicaoStatusOptions.map((o) => [o.value, o.label]))
const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  pendente: "outline",
  aprovada: "secondary",
  paga: "default",
  atrasada: "destructive",
  rejeitada: "destructive",
}

export function MedicoesGlobaisTable() {
  const { data: medicoes, isLoading } = useMedicoesGlobal()

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competência</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>% Executado</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}
          {!isLoading && medicoes?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhuma medição encontrada.
              </TableCell>
            </TableRow>
          )}
          {medicoes?.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{formatDateShort(m.competencia)}</TableCell>
              <TableCell>
                <Link href={`/contratos/${m.contrato_id}`} className="hover:underline">
                  {m.contratos?.numero} · {m.contratos?.clientes?.nome}
                </Link>
              </TableCell>
              <TableCell>{m.numero}</TableCell>
              <TableCell>{formatCurrencyBRL(m.valor)}</TableCell>
              <TableCell>{m.percentual_executado}%</TableCell>
              <TableCell>
                <Badge variant={statusVariant[m.status]}>{statusLabel[m.status]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
