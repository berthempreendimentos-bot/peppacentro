import { z } from "zod"

// Mapa completo, usado para exibir a categoria de qualquer documento já existente.
export const documentoCategoriaOptions = [
  { value: "contrato", label: "Contrato" },
  { value: "apolice", label: "Apólice" },
  { value: "planilha", label: "Planilha de Custo" },
  { value: "edital", label: "Edital" },
  { value: "proposta", label: "Proposta" },
  { value: "art", label: "ART" },
  { value: "nota_fiscal", label: "Nota Fiscal" },
  { value: "boleto", label: "Boleto" },
  { value: "ordem_servico", label: "Ordem de Serviço" },
  { value: "foto", label: "Foto" },
  { value: "relatorio", label: "Relatório" },
  { value: "aditivo", label: "Aditivo" },
  { value: "folha_pagamento", label: "Folha de Pagamento" },
  { value: "outro", label: "Outro" },
] as const

// Opções mostradas no formulário de envio de documento.
export const documentoCategoriaUploadOptions = [
  { value: "contrato", label: "Contrato" },
  { value: "apolice", label: "Apólice" },
  { value: "planilha", label: "Planilha de Custo" },
  { value: "outro", label: "Outros" },
] as const

export const documentoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do documento"),
  categoria: z.enum([
    "contrato",
    "edital",
    "proposta",
    "art",
    "nota_fiscal",
    "boleto",
    "ordem_servico",
    "foto",
    "relatorio",
    "planilha",
    "aditivo",
    "apolice",
    "outro",
  ]),
  validade: z.string().optional(),
})

export type DocumentoInput = z.infer<typeof documentoSchema>
