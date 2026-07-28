"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { clienteSchema, type ClienteInput } from "@/lib/validations/clientes"
import { useCreateCliente, useUpdateCliente, type Cliente } from "@/lib/queries/clientes"
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

const emptyValues: ClienteInput = {
  tipo_pessoa: "PJ",
  nome: "",
  cpf_cnpj: "",
  responsavel: "",
  telefone: "",
  email: "",
  endereco: "",
  praca_pagamento: "",
  observacoes: "",
}

export function ClienteFormDialog({
  trigger,
  cliente,
}: {
  trigger: React.ReactNode
  cliente?: Cliente
}) {
  const [open, setOpen] = useState(false)
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const isEditing = !!cliente

  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        cliente
          ? {
              tipo_pessoa: cliente.tipo_pessoa,
              nome: cliente.nome,
              cpf_cnpj: cliente.cpf_cnpj,
              responsavel: cliente.responsavel ?? "",
              telefone: cliente.telefone ?? "",
              email: cliente.email ?? "",
              endereco: cliente.endereco ?? "",
              praca_pagamento: cliente.praca_pagamento ?? "",
              observacoes: cliente.observacoes ?? "",
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cliente])

  async function onSubmit(values: ClienteInput) {
    try {
      if (isEditing) {
        await updateCliente.mutateAsync({ id: cliente.id, input: values })
        toast.success("Cliente atualizado")
      } else {
        await createCliente.mutateAsync(values)
        toast.success("Cliente cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o cliente"
      )
    }
  }

  const isSubmitting = createCliente.isPending || updateCliente.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Dados cadastrais do cliente, pessoa física ou jurídica.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="tipo_pessoa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
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
            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Pessoa de contato" {...field} />
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
              name="praca_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Praça de Pagamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco do Brasil" {...field} />
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
