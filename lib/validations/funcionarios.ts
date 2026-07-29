import { z } from "zod"

export const grauInsalubridadeValues = ["nenhum", "minimo", "medio", "maximo"] as const

export const funcionarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  matricula: z.string().optional(),
  cpf: z.string().optional(),
  funcao: z.string().optional(),
  data_admissao: z.string().optional(),
  salario_base: z.number().min(0, "Informe um valor válido"),
  vt_informado: z.number().min(0, "Informe um valor válido"),
  vr_informado: z.number().min(0, "Informe um valor válido"),
  faltas: z.number().min(0).optional().default(0),
  reembolso: z.number().min(0).optional().default(0),
  reembolso_creche: z.number().min(0).optional().default(0),
  recebe_periculosidade: z.boolean().default(false),
  grau_insalubridade: z.enum(grauInsalubridadeValues),
})

export type FuncionarioInput = z.infer<typeof funcionarioSchema>
