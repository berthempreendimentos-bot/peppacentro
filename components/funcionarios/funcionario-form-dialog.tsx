"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  funcionarioSchema,
  type FuncionarioInput,
} from "@/lib/validations/funcionarios"
import {
  useCreateFuncionario,
  useUpdateFuncionario,
  type Funcionario,
} from "@/lib/queries/funcionarios"
import { getErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CurrencyInput } from "@/components/ui/currency-input"
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

const emptyValues: FuncionarioInput = {
  nome: "",
  cpf: "",
  funcao: "",
  data_admissao: "",
  salario_base: 0,
  vt_informado: 0,
  vr_informado: 0,
  recebe_periculosidade: false,
  grau_insalubridade: "nenhum",
}

const grauInsalubridadeLabels: Record<FuncionarioInput["grau_insalubridade"], string> = {
  nenhum: "Nenhum",
  minimo: "Mínimo (10%)",
  medio: "Médio (20%)",
  maximo: "Máximo (40%)",
}

export function FuncionarioFormDialog({
  contratoId,
  trigger,
  funcionario,
}: {
  contratoId: string
  trigger: React.ReactNode
  funcionario?: Funcionario
}) {
  const [open, setOpen] = useState(false)
  const createFuncionario = useCreateFuncionario(contratoId)
  const updateFuncionario = useUpdateFuncionario(contratoId)
  const isEditing = !!funcionario

  const form = useForm<FuncionarioInput>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        funcionario
          ? {
              nome: funcionario.nome,
              cpf: funcionario.cpf ?? "",
              funcao: funcionario.funcao ?? "",
              data_admissao: funcionario.data_admissao ?? "",
              salario_base: funcionario.salario_base,
              vt_informado: funcionario.vt_informado,
              vr_informado: funcionario.vr_informado,
              recebe_periculosidade: funcionario.recebe_periculosidade,
              grau_insalubridade: funcionario.grau_insalubridade,
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, funcionario])

  async function onSubmit(values: FuncionarioInput) {
    try {
      if (isEditing) {
        await updateFuncionario.mutateAsync({ id: funcionario.id, input: values })
        toast.success("Funcionário atualizado")
      } else {
        await createFuncionario.mutateAsync(values)
        toast.success("Funcionário cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o funcionário"))
    }
  }

  const isSubmitting = createFuncionario.isPending || updateFuncionario.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
          <DialogDescription>
            Dados usados para calcular os encargos do funcionário no contrato.
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
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="Somente números" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="funcao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Vigilante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="data_admissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admissão</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salario_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salário Base</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vt_informado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VT Informado</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vr_informado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VR Informado</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="recebe_periculosidade"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Recebe adicional de periculosidade (30%)
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grau_insalubridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grau de Insalubridade</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(grauInsalubridadeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
