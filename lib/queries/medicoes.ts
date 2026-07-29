"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { MedicaoInput } from "@/lib/validations/medicoes"
import type { Database } from "@/lib/supabase/database.types"

export type Medicao = Database["public"]["Tables"]["medicoes"]["Row"]

export function useMedicoes(contratoId: string) {
  return useQuery({
    queryKey: ["medicoes", contratoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("medicoes")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("numero", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

export function useMedicoesGlobal() {
  return useQuery({
    queryKey: ["medicoes", "global"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("medicoes")
        .select("*, contratos(numero, clientes(nome))")
        .order("competencia", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function normalize(input: MedicaoInput) {
  return { ...input, data: input.data || null }
}

async function criarLancamentoVinculado(
  supabase: ReturnType<typeof createClient>,
  contratoId: string,
  input: MedicaoInput
) {
  if (input.status !== "aprovada" && input.status !== "paga") return null

  const { data: lancamento, error } = await supabase
    .from("lancamentos")
    .insert({
      contrato_id: contratoId,
      tipo: "medicao",
      descricao: `Medição nº ${input.numero}`,
      valor: input.valor,
      data: input.data || new Date().toISOString().slice(0, 10),
      status: input.status === "paga" ? "pago" : "pendente",
    })
    .select("id")
    .single()
  if (error) throw error
  return lancamento.id as string
}

export function useCreateMedicao(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MedicaoInput) => {
      const supabase = createClient()
      const lancamentoId = await criarLancamentoVinculado(supabase, contratoId, input)

      const { data, error } = await supabase
        .from("medicoes")
        .insert({
          ...normalize(input),
          contrato_id: contratoId,
          lancamento_id: lancamentoId,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicoes", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["medicoes", "global"] })
      queryClient.invalidateQueries({ queryKey: ["lancamentos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["lancamentos", "global"] })
    },
  })
}

export function useUpdateMedicao(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MedicaoInput }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("medicoes")
        .update(normalize(input))
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicoes", contratoId] }),
  })
}

// Ao fechar a medição (status aprovada/paga), salva um snapshot da Folha
// de Pagamento do mês em Storage para download posterior, mesmo que a
// folha dos funcionários mude depois.
export function useFecharFolhaMedicao(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ medicaoId, taxasQuery }: { medicaoId: string; taxasQuery: string }) => {
      const res = await fetch(`/api/medicoes/${medicaoId}/fechar-folha?${taxasQuery}`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || "Não foi possível salvar a folha de pagamento")
      }
      return res.json() as Promise<{ documentoId: string }>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicoes", contratoId] }),
  })
}

export function useDeleteMedicao(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("medicoes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicoes", contratoId] }),
  })
}
