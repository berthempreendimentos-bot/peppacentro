"use client"

import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { useDocumentosGlobal, useDownloadDocumento, type Documento } from "@/lib/queries/documentos"
import { documentoCategoriaOptions } from "@/lib/validations/documentos"
import { formatBytes, formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categoriaLabel = Object.fromEntries(
  documentoCategoriaOptions.map((o) => [o.value, o.label])
)

function validadeBadge(validade: string | null) {
  if (!validade) return "—"
  const hoje = new Date().toISOString().slice(0, 10)
  const em30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (validade < hoje) {
    return <Badge variant="destructive">Vencido em {formatDate(validade)}</Badge>
  }
  if (validade <= em30) {
    return <Badge variant="outline">Vence em {formatDate(validade)}</Badge>
  }
  return formatDate(validade)
}

export function DocumentosGlobaisTable() {
  const { data: documentos, isLoading } = useDocumentosGlobal()
  const downloadDocumento = useDownloadDocumento()
  const [selectedContratoId, setSelectedContratoId] = useState<string>("todos")
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("todas")

  async function handleDownload(documento: Documento) {
    try {
      const url = await downloadDocumento.mutateAsync(documento.storage_path)
      window.open(url, "_blank")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar link de download")
    }
  }

  const documentosAgrupados = useMemo(() => {
    if (!documentos) return []
    const map = new Map<string, { contratoId: string; titulo: string; itens: Documento[] }>()
    
    for (const doc of documentos) {
      const contratoId = doc.contrato_id
      const titulo = doc.contratos 
        ? `${doc.contratos.numero} · ${doc.contratos.clientes?.nome}` 
        : "Sem contrato"
        
      if (!map.has(contratoId)) {
        map.set(contratoId, { contratoId, titulo, itens: [] })
      }
      map.get(contratoId)!.itens.push(doc)
    }
    
    return Array.from(map.values())
  }, [documentos])

  const gruposFiltrados = useMemo(() => {
    let grupos = documentosAgrupados
    if (selectedContratoId !== "todos") {
      grupos = grupos.filter((g) => g.contratoId === selectedContratoId)
    }
    if (selectedCategoriaId !== "todas") {
      grupos = grupos
        .map((g) => ({
          ...g,
          itens: g.itens.filter((i) => i.categoria === selectedCategoriaId),
        }))
        .filter((g) => g.itens.length > 0)
    }
    return grupos
  }, [documentosAgrupados, selectedContratoId, selectedCategoriaId])

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (documentosAgrupados.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="py-8 text-center text-muted-foreground">
          Nenhum documento encontrado.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm font-medium whitespace-nowrap">Filtrar por contrato:</span>
          <Select value={selectedContratoId} onValueChange={setSelectedContratoId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Selecione um contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os contratos</SelectItem>
              {documentosAgrupados.map((grupo) => (
                <SelectItem key={grupo.contratoId} value={grupo.contratoId}>
                  {grupo.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm font-medium whitespace-nowrap">Filtrar por categoria:</span>
          <Select value={selectedCategoriaId} onValueChange={setSelectedCategoriaId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {documentoCategoriaOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {gruposFiltrados.length === 0 && (
          <div className="rounded-lg border">
            <div className="py-8 text-center text-muted-foreground">
              Nenhum documento encontrado para este contrato.
            </div>
          </div>
        )}
        {gruposFiltrados.map((grupo) => (
          <div key={grupo.contratoId} className="flex flex-col gap-3">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.itens.map((documento) => (
                  <TableRow key={documento.id}>
                    <TableCell className="max-w-xs truncate font-medium">{documento.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoriaLabel[documento.categoria]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatBytes(documento.tamanho)}
                    </TableCell>
                    <TableCell>{validadeBadge(documento.validade)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDownload(documento)}>
                        <Download className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
    </div>
  )
}
