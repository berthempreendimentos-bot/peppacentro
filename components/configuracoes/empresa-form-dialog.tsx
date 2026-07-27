"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { empresaSchema, type EmpresaInput } from "@/lib/validations/empresas"
import {
  useCreateEmpresa,
  useUpdateEmpresa,
  type Empresa,
} from "@/lib/queries/empresas"
import { getErrorMessage } from "@/lib/utils"
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

const emptyValues: EmpresaInput = {
  nome: "",
  nome_fantasia: "",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
}

export function EmpresaFormDialog({
  trigger,
  empresa,
}: {
  trigger: React.ReactNode
  empresa?: Empresa
}) {
  const [open, setOpen] = useState(false)
  const createEmpresa = useCreateEmpresa()
  const updateEmpresa = useUpdateEmpresa()
  const isEditing = !!empresa

  const form = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        empresa
          ? {
              nome: empresa.nome,
              nome_fantasia: empresa.nome_fantasia ?? "",
              cnpj: empresa.cnpj ?? "",
              telefone: empresa.telefone ?? "",
              email: empresa.email ?? "",
              endereco: empresa.endereco ?? "",
              observacoes: empresa.observacoes ?? "",
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresa])

  async function onSubmit(values: EmpresaInput) {
    try {
      if (isEditing) {
        await updateEmpresa.mutateAsync({ id: empresa.id, input: values })
        toast.success("Empresa atualizada")
      } else {
        await createEmpresa.mutateAsync(values)
        toast.success("Empresa cadastrada")
      }
      setOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar a empresa"))
    }
  }

  const isSubmitting = createEmpresa.isPending || updateEmpresa.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          <DialogDescription>
            Dados da empresa/filial própria usada nos contratos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão social</FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome_fantasia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome fantasia</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="Somente números" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
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
