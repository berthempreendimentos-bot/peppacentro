import { z } from "zod"

export const medicaoStatusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "aprovada", label: "Aprovada" },
  { value: "paga", label: "Paga" },
  { value: "atrasada", label: "Atrasada" },
  { value: "rejeitada", label: "Rejeitada" },
] as const

export const medicaoSchema = z.object({
  numero: z.number().int().min(1, "Informe o número"),
  competencia: z.string().min(1, "Informe a competência"),
  valor: z.number().min(0.01, "Informe um valor"),
  percentual_executado: z.number().min(0).max(100),
  data: z.string().optional(),
  status: z.enum(["pendente", "aprovada", "paga", "atrasada", "rejeitada"]),
  mao_de_obra: z.number().min(0),
  vale_transporte: z.number().min(0),
  vale_refeicao: z.number().min(0),
  material: z.number().min(0),
  valor_contrato: z.number().min(0),
})

export type MedicaoInput = z.infer<typeof medicaoSchema>
