import { z } from "zod"

export const cronogramaEtapaOptions = [
  { value: "planejamento", label: "Planejamento" },
  { value: "execucao", label: "Execução" },
  { value: "fiscalizacao", label: "Fiscalização" },
  { value: "medicoes", label: "Medições" },
  { value: "pagamento", label: "Pagamento" },
  { value: "entrega", label: "Entrega" },
  { value: "encerramento", label: "Encerramento" },
  { value: "integracao", label: "Integração" },
] as const

export const cronogramaStatusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "atrasado", label: "Atrasado" },
] as const

export const etapaSchema = z.object({
  etapa: z.enum([
    "planejamento",
    "execucao",
    "fiscalizacao",
    "medicoes",
    "pagamento",
    "entrega",
    "encerramento",
    "integracao",
  ]),
  data_inicial: z.string().optional(),
  data_final: z.string().optional(),
  responsavel_id: z.string().optional(),
  percentual: z.number().min(0).max(100),
  status: z.enum(["pendente", "em_andamento", "concluido", "atrasado"]),
})

export type EtapaInput = z.infer<typeof etapaSchema>
