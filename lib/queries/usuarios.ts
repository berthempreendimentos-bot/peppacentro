"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { CriarUsuarioInput } from "@/lib/validations/usuarios"
import type { Database, UserRole } from "@/lib/supabase/database.types"

export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"]

const ADMIN_QUERY_KEY = ["usuarios", "admin"] as const

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, role")
        .eq("ativo", true)
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

// Lista completa (inclui inativos) usada só no painel de configuração master.
export function useUsuariosAdmin() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("nome")
      if (error) throw error
      return data
    },
  })
}

export function useCreateUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CriarUsuarioInput) => {
      const resposta = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const dados = await resposta.json().catch(() => null)
      if (!resposta.ok) {
        throw new Error(dados?.error ?? "Não foi possível criar o usuário")
      }
      return dados
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: Partial<{ role: UserRole; ativo: boolean; nome: string }>
    }) => {
      const supabase = createClient()
      const { error } = await supabase.from("usuarios").update(input).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const resposta = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" })
      const dados = await resposta.json().catch(() => null)
      if (!resposta.ok) {
        throw new Error(dados?.error ?? "Não foi possível excluir o usuário")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
    },
  })
}
