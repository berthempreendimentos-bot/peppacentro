"use client"

import { useState } from "react"
import { Download, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useDocumentos,
  useDeleteDocumento,
  useDownloadDocumento,
  type Documento,
} from "@/lib/queries/documentos"
import { documentoCategoriaOptions } from "@/lib/validations/documentos"
import { formatBytes, formatDate } from "@/lib/format"
import { DocumentoUploadDialog } from "@/components/documentos/documento-upload-dialog"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const categoriaLabel = Object.fromEntries(
  documentoCategoriaOptions.map((o) => [o.value, o.label])
)

function validadeBadge(validade: string | null) {
  if (!validade) return null
  const hoje = new Date().toISOString().slice(0, 10)
  const em30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  if (validade < hoje) {
    return <Badge variant="destructive">Vencido em {formatDate(validade)}</Badge>
  }
  if (validade <= em30) {
    return <Badge variant="outline">Vence em {formatDate(validade)}</Badge>
  }
  return <span className="text-muted-foreground">{formatDate(validade)}</span>
}

export function DocumentosTable({ contratoId }: { contratoId: string }) {
  const { data: documentos, isLoading } = useDocumentos(contratoId)
  const deleteDocumento = useDeleteDocumento(contratoId)
  const downloadDocumento = useDownloadDocumento()
  const [paraExcluir, setParaExcluir] = useState<Documento | null>(null)

  async function handleDownload(documento: Documento) {
    try {
      const url = await downloadDocumento.mutateAsync(documento.storage_path)
      window.open(url, "_blank")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar link de download")
    }
  }

  async function handleDelete() {
    if (!paraExcluir) return
    try {
      await deleteDocumento.mutateAsync(paraExcluir)
      toast.success("Documento removido")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover documento")
    } finally {
      setParaExcluir(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DocumentoUploadDialog
          contratoId={contratoId}
          trigger={
            <Button>
              <Plus /> Enviar Documento
            </Button>
          }
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Enviado em</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && documentos?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum documento enviado.
                </TableCell>
              </TableRow>
            )}
            {documentos?.map((documento) => (
              <TableRow key={documento.id}>
                <TableCell className="max-w-xs truncate font-medium">
                  {documento.nome}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{categoriaLabel[documento.categoria]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatBytes(documento.tamanho)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(documento.created_at)}
                </TableCell>
                <TableCell>{validadeBadge(documento.validade) ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDownload(documento)}
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setParaExcluir(documento)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!paraExcluir}
        onOpenChange={(open) => !open && setParaExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo será removido do armazenamento permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
