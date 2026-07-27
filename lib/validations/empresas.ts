import { z } from "zod"

export const empresaSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
})

export type EmpresaInput = z.infer<typeof empresaSchema>
