"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { fornecedorSchema, type FornecedorInput } from "@/lib/validations/fornecedores"
import {
  useCreateFornecedor,
  useUpdateFornecedor,
  type Fornecedor,
} from "@/lib/queries/fornecedores"
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

const emptyValues: FornecedorInput = {
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
}

export function FornecedorFormDialog({
  trigger,
  fornecedor,
}: {
  trigger: React.ReactNode
  fornecedor?: Fornecedor
}) {
  const [open, setOpen] = useState(false)
  const createFornecedor = useCreateFornecedor()
  const updateFornecedor = useUpdateFornecedor()
  const isEditing = !!fornecedor

  const form = useForm<FornecedorInput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        fornecedor
          ? {
              nome: fornecedor.nome,
              cpf_cnpj: fornecedor.cpf_cnpj ?? "",
              telefone: fornecedor.telefone ?? "",
              email: fornecedor.email ?? "",
              endereco: fornecedor.endereco ?? "",
              observacoes: fornecedor.observacoes ?? "",
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fornecedor])

  async function onSubmit(values: FornecedorInput) {
    try {
      if (isEditing) {
        await updateFornecedor.mutateAsync({ id: fornecedor.id, input: values })
        toast.success("Fornecedor atualizado")
      } else {
        await createFornecedor.mutateAsync(values)
        toast.success("Fornecedor cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o fornecedor"
      )
    }
  }

  const isSubmitting = createFornecedor.isPending || updateFornecedor.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          <DialogDescription>Dados cadastrais do fornecedor.</DialogDescription>
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
                    <Input placeholder="Razão social ou nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf_cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF/CNPJ</FormLabel>
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
