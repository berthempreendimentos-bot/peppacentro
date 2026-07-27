"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { EtapaInput } from "@/lib/validations/cronograma"
import type { Database } from "@/lib/supabase/database.types"

export type Etapa = Database["public"]["Tables"]["cronograma"]["Row"]

export function useCronograma(contratoId: string) {
  return useQuery({
    queryKey: ["cronograma", contratoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cronograma")
        .select("*, usuarios(nome)")
        .eq("contrato_id", contratoId)
        .order("created_at")
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

function normalize(input: EtapaInput) {
  return {
    ...input,
    data_inicial: input.data_inicial || null,
    data_final: input.data_final || null,
    responsavel_id: input.responsavel_id || null,
  }
}

export function useCreateEtapa(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: EtapaInput) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("cronograma")
        .insert({ ...normalize(input), contrato_id: contratoId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cronograma", contratoId] }),
  })
}

export function useUpdateEtapa(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EtapaInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("cronograma")
        .update(normalize(input))
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cronograma", contratoId] }),
  })
}

export function useDeleteEtapa(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("cronograma").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cronograma", contratoId] }),
  })
}
