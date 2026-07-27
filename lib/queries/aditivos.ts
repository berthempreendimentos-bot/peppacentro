"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { AditivoInput } from "@/lib/validations/aditivos"
import type { Database } from "@/lib/supabase/database.types"

export type Aditivo = Database["public"]["Tables"]["aditivos"]["Row"]

export function useAditivos(contratoId: string) {
  return useQuery({
    queryKey: ["aditivos", contratoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("aditivos")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

export function useCreateAditivo(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AditivoInput) => {
      const supabase = createClient()
      const { error: insertError } = await supabase.from("aditivos").insert({
        contrato_id: contratoId,
        prazo_dias: input.prazo_dias || null,
        novo_valor: input.novo_valor || null,
        objeto: input.objeto || null,
        justificativa: input.justificativa,
      })
      if (insertError) throw insertError

      // Um aditivo pode alterar o valor e/ou o prazo do contrato.
      if (input.novo_valor || input.prazo_dias) {
        const { data: contrato, error: contratoError } = await supabase
          .from("contratos")
          .select("data_fim")
          .eq("id", contratoId)
          .single()
        if (contratoError) throw contratoError

        const update: Database["public"]["Tables"]["contratos"]["Update"] = {}
        if (input.novo_valor) update.valor_atual = input.novo_valor
        if (input.prazo_dias && contrato.data_fim) {
          const novaData = new Date(contrato.data_fim)
          novaData.setUTCDate(novaData.getUTCDate() + input.prazo_dias)
          update.data_fim = novaData.toISOString().slice(0, 10)
        }

        const { error: updateError } = await supabase
          .from("contratos")
          .update(update)
          .eq("id", contratoId)
        if (updateError) throw updateError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aditivos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["contratos"] })
      queryClient.invalidateQueries({ queryKey: ["contratos", contratoId] })
    },
  })
}

export function useDeleteAditivo(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("aditivos").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aditivos", contratoId] }),
  })
}
