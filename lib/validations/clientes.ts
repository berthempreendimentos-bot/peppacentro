import { z } from "zod"

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export const clienteSchema = z
  .object({
    tipo_pessoa: z.enum(["PF", "PJ"]),
    nome: z.string().min(2, "Informe o nome"),
    cpf_cnpj: z.string().min(11, "Informe o CPF/CNPJ"),
    responsavel: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    endereco: z.string().optional(),
    praca_pagamento: z.string().optional(),
    observacoes: z.string().optional(),
  })
  .refine(
    (data) => {
      const digits = onlyDigits(data.cpf_cnpj)
      return data.tipo_pessoa === "PF" ? digits.length === 11 : digits.length === 14
    },
    {
      message: "CPF deve ter 11 dígitos e CNPJ 14 dígitos",
      path: ["cpf_cnpj"],
    }
  )

export type ClienteInput = z.infer<typeof clienteSchema>
