import { z } from "zod"

export const lancamentoTipoOptions = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
  { value: "pagamento", label: "Pagamento" },
  { value: "recebimento", label: "Recebimento" },
  { value: "retencao", label: "Retenção" },
  { value: "impostos", label: "Impostos" },
  { value: "medicao", label: "Medição" },
] as const

export const lancamentoStatusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
] as const

export const lancamentoSchema = z.object({
  tipo: z.enum([
    "receita",
    "despesa",
    "pagamento",
    "recebimento",
    "retencao",
    "impostos",
    "medicao",
  ]),
  descricao: z.string().min(2, "Informe a descrição"),
  categoria_id: z.string().optional(),
  valor: z.number().min(0.01, "Informe um valor"),
  data: z.string().min(1, "Informe a data"),
  mes_referencia: z.string().optional().nullable(),
  fornecedor_id: z.string().optional(),
  centro_custo_id: z.string().optional(),
  status: z.enum(["pendente", "pago", "atrasado", "cancelado"]),
})

export type LancamentoInput = z.infer<typeof lancamentoSchema>
