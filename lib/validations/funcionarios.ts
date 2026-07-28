import { z } from "zod"

export const funcionarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  cpf: z.string().optional(),
  funcao: z.string().optional(),
  data_admissao: z.string().optional(),
  salario_base: z.number().min(0, "Informe um valor válido"),
  vt_informado: z.number().min(0, "Informe um valor válido"),
  vr_informado: z.number().min(0, "Informe um valor válido"),
  recebe_periculosidade: z.boolean(),
})

export type FuncionarioInput = z.infer<typeof funcionarioSchema>
