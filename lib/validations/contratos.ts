import { z } from "zod"

export const contratoSituacaoOptions = [
  { value: "em_andamento", label: "Em andamento" },
  { value: "executado", label: "Executado" },
  { value: "encerrado", label: "Encerrado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "inicializacao", label: "Inicialização" },
] as const

export const contratoSchema = z.object({
  numero: z.string().min(1, "Informe o número"),
  objeto: z.string().min(3, "Informe o objeto do contrato"),
  cliente_id: z.string().min(1, "Selecione um cliente"),
  empresa: z.string().optional(),
  tipo: z.string().optional(),
  fonte_recurso: z.string().optional(),
  valor_inicial: z.number().min(0, "Valor inválido"),
  valor_atual: z.number().min(0, "Valor inválido"),
  data_assinatura: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  situacao: z.enum(["em_andamento", "executado", "encerrado", "cancelado", "inicializacao"]),
  fiscal_id: z.string().optional(),
  gestor_id: z.string().optional(),
})

export type ContratoInput = z.infer<typeof contratoSchema>
