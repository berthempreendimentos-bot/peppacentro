import { z } from "zod"

export const cotacaoStatusOptions = [
  { value: "aberta", label: "Aberta" },
  { value: "fechada", label: "Fechada" },
  { value: "cancelada", label: "Cancelada" },
] as const

export const cotacaoSchema = z.object({
  titulo: z.string().min(2, "Informe o título"),
  descricao: z.string().optional(),
  contrato_id: z.string().optional(),
  status: z.enum(["aberta", "fechada", "cancelada"]),
})

export type CotacaoInput = z.infer<typeof cotacaoSchema>
