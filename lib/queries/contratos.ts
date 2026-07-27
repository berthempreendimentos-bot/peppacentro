"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { ContratoInput } from "@/lib/validations/contratos"
import type { Database } from "@/lib/supabase/database.types"

export type Contrato = Database["public"]["Tables"]["contratos"]["Row"]

const QUERY_KEY = ["contratos"] as const

export function useContratos() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contratos")
        .select("*, clientes(nome), postos_servico(quantidade)")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contratos")
        .select(
          "*, clientes(nome), fiscal:usuarios!contratos_fiscal_id_fkey(nome), gestor:usuarios!contratos_gestor_id_fkey(nome)"
        )
        .eq("id", id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

function normalize(input: ContratoInput) {
  return {
    ...input,
    empresa: input.empresa || null,
    tipo: input.tipo || null,
    fonte_recurso: input.fonte_recurso || null,
    data_assinatura: input.data_assinatura || null,
    data_inicio: input.data_inicio || null,
    data_fim: input.data_fim || null,
    fiscal_id: input.fiscal_id || null,
    gestor_id: input.gestor_id || null,
  }
}

export function useCreateContrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ContratoInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contratos")
        .insert(normalize(input))
        .select("id")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateContrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ContratoInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("contratos")
        .update(normalize(input))
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] })
    },
  })
}

export function useDeleteContrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("contratos").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateValorContrato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: number }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("contratos")
        .update({ valor_atual: valor })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] })
    },
  })
}
