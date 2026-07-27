import { z } from "zod"

export const centroCustoSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  descricao: z.string().optional(),
})

export type CentroCustoInput = z.infer<typeof centroCustoSchema>

export const categoriaSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  tipo: z.enum(["receita", "despesa"]),
  centro_custo_id: z.string().optional(),
})

export type CategoriaInput = z.infer<typeof categoriaSchema>
