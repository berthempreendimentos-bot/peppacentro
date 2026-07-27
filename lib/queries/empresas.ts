"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { EmpresaInput } from "@/lib/validations/empresas"
import type { Database } from "@/lib/supabase/database.types"

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"]

const QUERY_KEY = ["empresas"] as const

export function useEmpresas() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: EmpresaInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.from("empresas").insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: EmpresaInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("empresas")
        .update(input)
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("empresas").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
