"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { FornecedorInput } from "@/lib/validations/fornecedores"
import type { Database } from "@/lib/supabase/database.types"

export type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"]

const QUERY_KEY = ["fornecedores"] as const

export function useFornecedores() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: FornecedorInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.from("fornecedores").insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FornecedorInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("fornecedores")
        .update(input)
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("fornecedores").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
