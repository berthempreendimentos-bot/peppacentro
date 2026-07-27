"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import { onlyDigits } from "@/lib/format"
import type { ClienteInput } from "@/lib/validations/clientes"
import type { Database } from "@/lib/supabase/database.types"

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"]

const QUERY_KEY = ["clientes"] as const

export function useClientes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

function normalize(input: ClienteInput) {
  return { ...input, cpf_cnpj: onlyDigits(input.cpf_cnpj) }
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ClienteInput) => {
      const supabase = createClient()
      const { error } = await supabase.from("clientes").insert(normalize(input))
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ClienteInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("clientes")
        .update(normalize(input))
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("clientes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
