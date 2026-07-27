"use client"

import {
  linhaCategoriaOptions,
  somarTodosModulos,
  type LinhaCategoria,
  type LinhaPlanilha,
} from "@/lib/xlsx/analyze"
import { formatCurrencyBRL } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ClassificarLinhasTable({
  aba,
  nomePosto,
  onNomePostoChange,
  quantidade,
  onQuantidadeChange,
  linhas,
  onLinhaCategoriaChange,
}: {
  aba: string
  nomePosto: string
  onNomePostoChange: (nome: string) => void
  quantidade: number
  onQuantidadeChange: (quantidade: number) => void
  linhas: LinhaPlanilha[]
  onLinhaCategoriaChange: (linha: number, categoria: LinhaCategoria) => void
}) {
  const totalPreview = somarTodosModulos(linhas) * (quantidade || 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Nome do posto</Label>
          <Input value={nomePosto} onChange={(e) => onNomePostoChange(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => onQuantidadeChange(e.target.valueAsNumber || 1)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Aba <span className="font-medium">{aba}</span> — confira a categoria
        sugerida para cada linha e corrija se necessário.
      </p>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-44">Categoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha) => (
              <TableRow key={linha.linha}>
                <TableCell className="max-w-xs truncate">{linha.descricao}</TableCell>
                <TableCell>
                  {linha.valor !== null ? formatCurrencyBRL(linha.valor) : "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={linha.categoria}
                    onValueChange={(v) =>
                      onLinhaCategoriaChange(linha.linha, v as LinhaCategoria)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {linhaCategoriaOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                  Nenhuma linha com dados foi encontrada nesta aba.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Custo total estimado do posto (x{quantidade || 1})
        </span>
        <span className="font-mono text-lg font-semibold">
          {formatCurrencyBRL(totalPreview)}
        </span>
      </div>
    </div>
  )
}
