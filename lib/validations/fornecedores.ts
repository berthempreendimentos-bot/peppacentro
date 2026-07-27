import { z } from "zod"

export const fornecedorSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  cpf_cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
})

export type FornecedorInput = z.infer<typeof fornecedorSchema>
