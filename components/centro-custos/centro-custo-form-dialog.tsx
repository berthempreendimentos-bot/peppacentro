"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { centroCustoSchema, type CentroCustoInput } from "@/lib/validations/centro-custos"
import {
  useCreateCentroCusto,
  useUpdateCentroCusto,
  type CentroCusto,
} from "@/lib/queries/centro-custos"
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

const emptyValues: CentroCustoInput = { nome: "", descricao: "" }

export function CentroCustoFormDialog({
  trigger,
  centroCusto,
}: {
  trigger: React.ReactNode
  centroCusto?: CentroCusto
}) {
  const [open, setOpen] = useState(false)
  const createCentroCusto = useCreateCentroCusto()
  const updateCentroCusto = useUpdateCentroCusto()
  const isEditing = !!centroCusto

  const form = useForm<CentroCustoInput>({
    resolver: zodResolver(centroCustoSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        centroCusto
          ? { nome: centroCusto.nome, descricao: centroCusto.descricao ?? "" }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, centroCusto])

  async function onSubmit(values: CentroCustoInput) {
    try {
      if (isEditing) {
        await updateCentroCusto.mutateAsync({ id: centroCusto.id, input: values })
        toast.success("Centro de custo atualizado")
      } else {
        await createCentroCusto.mutateAsync(values)
        toast.success("Centro de custo cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar")
    }
  }

  const isSubmitting = createCentroCusto.isPending || updateCentroCusto.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar centro de custo" : "Novo centro de custo"}
          </DialogTitle>
          <DialogDescription>
            Ex.: Mão de obra, Combustível, Equipamentos, Material...
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Mão de obra" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
