"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  cotacaoSchema,
  cotacaoStatusOptions,
  type CotacaoInput,
} from "@/lib/validations/cotacoes"
import {
  useCreateCotacao,
  useUpdateCotacao,
  type Cotacao,
} from "@/lib/queries/cotacoes"
import { useContratos } from "@/lib/queries/contratos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

const emptyValues: CotacaoInput = {
  titulo: "",
  descricao: "",
  contrato_id: "",
  status: "aberta",
}

export function CotacaoFormDialog({
  trigger,
  cotacao,
}: {
  trigger: React.ReactNode
  cotacao?: Cotacao
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data: contratos } = useContratos()
  const createCotacao = useCreateCotacao()
  const updateCotacao = useUpdateCotacao(cotacao?.id ?? "")
  const isEditing = !!cotacao

  const form = useForm<CotacaoInput>({
    resolver: zodResolver(cotacaoSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        cotacao
          ? {
              titulo: cotacao.titulo,
              descricao: cotacao.descricao ?? "",
              contrato_id: cotacao.contrato_id ?? "",
              status: cotacao.status,
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cotacao])

  async function onSubmit(values: CotacaoInput) {
    try {
      if (isEditing) {
        await updateCotacao.mutateAsync(values)
        toast.success("Cotação atualizada")
        setOpen(false)
      } else {
        const nova = await createCotacao.mutateAsync(values)
        toast.success("Cotação criada")
        setOpen(false)
        router.push(`/cotacoes/${nova.id}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a cotação")
    }
  }

  const isSubmitting = createCotacao.isPending || updateCotacao.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cotação" : "Nova cotação"}</DialogTitle>
          <DialogDescription>
            Cadastre os produtos/serviços e as empresas depois de criar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Materiais de limpeza — Julho/2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contrato_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato (opcional)</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {contratos?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.numero} · {c.clientes?.nome}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cotacaoStatusOptions.map((opt) => (
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
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
