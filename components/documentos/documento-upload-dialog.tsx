"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  documentoCategoriaUploadOptions,
  documentoSchema,
  type DocumentoInput,
} from "@/lib/validations/documentos"
import { useUploadDocumento } from "@/lib/queries/documentos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categoriaLabel = Object.fromEntries(
  documentoCategoriaUploadOptions.map((o) => [o.value, o.label])
)

const emptyValues: DocumentoInput = { nome: "", categoria: "contrato", validade: "" }

export function DocumentoUploadDialog({
  trigger,
  contratoId,
}: {
  trigger: React.ReactNode
  contratoId: string
}) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const uploadDocumento = useUploadDocumento(contratoId)

  const form = useForm<DocumentoInput>({
    resolver: zodResolver(documentoSchema),
    defaultValues: emptyValues,
  })

  const categoria = form.watch("categoria")
  const isOutros = categoria === "outro"

  useEffect(() => {
    if (!isOutros) {
      form.setValue("nome", categoriaLabel[categoria] ?? "")
    } else if (file) {
      form.setValue("nome", file.name)
    } else {
      form.setValue("nome", "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    if (selected && isOutros) {
      form.setValue("nome", selected.name)
    }
  }

  async function onSubmit(values: DocumentoInput) {
    if (!file) {
      toast.error("Selecione um arquivo")
      return
    }
    try {
      await uploadDocumento.mutateAsync({ file, input: values })
      toast.success("Documento enviado")
      form.reset(emptyValues)
      setFile(null)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o documento")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          form.reset(emptyValues)
          setFile(null)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
          <DialogDescription>
            Arquivo armazenado no Supabase Storage, vinculado a este contrato.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Arquivo</label>
              <Input type="file" onChange={handleFileChange} />
            </div>
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentoCategoriaUploadOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isOutros} />
                  </FormControl>
                  {!isOutros && (
                    <p className="text-xs text-muted-foreground">
                      Selecione &quot;Outros&quot; para renomear o documento.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={uploadDocumento.isPending}>
                {uploadDocumento.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
