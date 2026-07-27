"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  cronogramaEtapaOptions,
  cronogramaStatusOptions,
  etapaSchema,
  type EtapaInput,
} from "@/lib/validations/cronograma"
import { useCreateEtapa, useUpdateEtapa, type Etapa } from "@/lib/queries/cronograma"
import { useUsuarios } from "@/lib/queries/usuarios"
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

const emptyValues: EtapaInput = {
  etapa: "planejamento",
  data_inicial: "",
  data_final: "",
  responsavel_id: "",
  percentual: 0,
  status: "pendente",
}

export function EtapaFormDialog({
  trigger,
  contratoId,
  etapa,
}: {
  trigger: React.ReactNode
  contratoId: string
  etapa?: Etapa
}) {
  const [open, setOpen] = useState(false)
  const { data: usuarios } = useUsuarios()
  const createEtapa = useCreateEtapa(contratoId)
  const updateEtapa = useUpdateEtapa(contratoId)
  const isEditing = !!etapa

  const form = useForm<EtapaInput>({
    resolver: zodResolver(etapaSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        etapa
          ? {
              etapa: etapa.etapa,
              data_inicial: etapa.data_inicial ?? "",
              data_final: etapa.data_final ?? "",
              responsavel_id: etapa.responsavel_id ?? "",
              percentual: etapa.percentual,
              status: etapa.status,
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, etapa])

  async function onSubmit(values: EtapaInput) {
    try {
      if (isEditing) {
        await updateEtapa.mutateAsync({ id: etapa.id, input: values })
        toast.success("Etapa atualizada")
      } else {
        await createEtapa.mutateAsync(values)
        toast.success("Etapa cadastrada")
      }
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar")
    }
  }

  const isSubmitting = createEtapa.isPending || updateEtapa.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar etapa" : "Nova etapa"}</DialogTitle>
          <DialogDescription>Etapa do cronograma de execução do contrato.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="etapa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cronogramaEtapaOptions.map((opt) => (
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_final"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="responsavel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {usuarios?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentual concluído</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
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
                        {cronogramaStatusOptions.map((opt) => (
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
