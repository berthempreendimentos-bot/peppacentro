import { z } from "zod"

export const aditivoSchema = z.object({
  prazo_dias: z.number().int().optional(),
  novo_valor: z.number().min(0).optional(),
  objeto: z.string().optional(),
  justificativa: z.string().min(3, "Informe a justificativa"),
})

export type AditivoInput = z.infer<typeof aditivoSchema>
