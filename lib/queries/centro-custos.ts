"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { CentroCustoInput, CategoriaInput } from "@/lib/validations/centro-custos"
import type { Database } from "@/lib/supabase/database.types"

export type CentroCusto = Database["public"]["Tables"]["centro_custos"]["Row"]
export type Categoria = Database["public"]["Tables"]["categorias"]["Row"]

const CENTRO_CUSTOS_KEY = ["centro_custos"] as const
const CATEGORIAS_KEY = ["categorias"] as const

export function useCentroCustos() {
  return useQuery({
    queryKey: CENTRO_CUSTOS_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("centro_custos")
        .select("*")
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

export function useCreateCentroCusto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CentroCustoInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.from("centro_custos").insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CENTRO_CUSTOS_KEY }),
  })
}

export function useUpdateCentroCusto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CentroCustoInput }) => {
      const supabase = createClient()
      const { error } = await supabase.from("centro_custos").update(input).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CENTRO_CUSTOS_KEY }),
  })
}

export function useDeleteCentroCusto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("centro_custos").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CENTRO_CUSTOS_KEY }),
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: CATEGORIAS_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categorias")
        .select("*, centro_custos(nome)")
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

function normalizeCategoria(input: CategoriaInput) {
  return { ...input, centro_custo_id: input.centro_custo_id || null }
}

export function useCreateCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CategoriaInput) => {
      const supabase = createClient()
      const { data, error } = await supabase.from("categorias").insert(normalizeCategoria(input)).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
  })
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CategoriaInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("categorias")
        .update(normalizeCategoria(input))
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
  })
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("categorias").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATEGORIAS_KEY }),
  })
}
