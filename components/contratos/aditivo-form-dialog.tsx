"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { aditivoSchema, type AditivoInput } from "@/lib/validations/aditivos"
import { useCreateAditivo } from "@/lib/queries/aditivos"
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

const emptyValues: AditivoInput = {
  prazo_dias: undefined,
  novo_valor: undefined,
  objeto: "",
  justificativa: "",
}

export function AditivoFormDialog({
  trigger,
  contratoId,
}: {
  trigger: React.ReactNode
  contratoId: string
}) {
  const [open, setOpen] = useState(false)
  const createAditivo = useCreateAditivo(contratoId)

  const form = useForm<AditivoInput>({
    resolver: zodResolver(aditivoSchema),
    defaultValues: emptyValues,
  })

  async function onSubmit(values: AditivoInput) {
    try {
      await createAditivo.mutateAsync(values)
      toast.success("Aditivo registrado")
      form.reset(emptyValues)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o aditivo"
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) form.reset(emptyValues)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo aditivo</DialogTitle>
          <DialogDescription>
            Prazo e/ou valor informados aqui atualizam automaticamente o contrato.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prazo_dias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex.: 30"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="novo_valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo valor do contrato</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="objeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto do aditivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Prorrogação de prazo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createAditivo.isPending}>
                {createAditivo.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
