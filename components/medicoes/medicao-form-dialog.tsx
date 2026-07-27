"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  medicaoSchema,
  medicaoStatusOptions,
  type MedicaoInput,
} from "@/lib/validations/medicoes"
import { useCreateMedicao, useUpdateMedicao, type Medicao } from "@/lib/queries/medicoes"
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

const emptyValues: MedicaoInput = {
  numero: 1,
  competencia: new Date().toISOString().slice(0, 7) + "-01",
  valor: 0,
  percentual_executado: 0,
  data: "",
  status: "pendente",
}

export function MedicaoFormDialog({
  trigger,
  contratoId,
  medicao,
  proximoNumero,
}: {
  trigger: React.ReactNode
  contratoId: string
  medicao?: Medicao
  proximoNumero?: number
}) {
  const [open, setOpen] = useState(false)
  const createMedicao = useCreateMedicao(contratoId)
  const updateMedicao = useUpdateMedicao(contratoId)
  const isEditing = !!medicao

  const form = useForm<MedicaoInput>({
    resolver: zodResolver(medicaoSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        medicao
          ? {
              numero: medicao.numero,
              competencia: medicao.competencia,
              valor: medicao.valor,
              percentual_executado: medicao.percentual_executado,
              data: medicao.data ?? "",
              status: medicao.status,
            }
          : { ...emptyValues, numero: proximoNumero ?? 1 }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, medicao, proximoNumero])

  async function onSubmit(values: MedicaoInput) {
    try {
      if (isEditing) {
        await updateMedicao.mutateAsync({ id: medicao.id, input: values })
        toast.success("Medição atualizada")
      } else {
        await createMedicao.mutateAsync(values)
        toast.success("Medição cadastrada")
      }
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar")
    }
  }

  const isSubmitting = createMedicao.isPending || updateMedicao.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar medição" : "Nova medição"}</DialogTitle>
          <DialogDescription>
            Medições aprovadas ou pagas geram automaticamente um lançamento financeiro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} value={field.value?.slice(0, 7)} onChange={(e) => field.onChange(`${e.target.value}-01`)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
                name="percentual_executado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>% executado</FormLabel>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                        {medicaoStatusOptions.map((opt) => (
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
