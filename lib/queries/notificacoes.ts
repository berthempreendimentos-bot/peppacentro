"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

const QUERY_KEY = ["notificacoes"] as const

export function useNotificacoes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const [{ data: notificacoes, error: notifError }, { data: lidas, error: lidasError }] =
        await Promise.all([
          supabase
            .from("view_notificacoes")
            .select("*")
            .order("data_referencia", { ascending: true }),
          user
            ? supabase.from("notificacoes_lidas").select("chave").eq("usuario_id", user.id)
            : Promise.resolve({ data: [], error: null }),
        ])

      if (notifError) throw notifError
      if (lidasError) throw lidasError

      const chavesLidas = new Set((lidas ?? []).map((l) => l.chave))

      return (notificacoes ?? []).map((n) => ({
        ...n,
        lida: chavesLidas.has(n.chave),
      }))
    },
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (chave: string) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from("notificacoes_lidas")
        .upsert({ usuario_id: user.id, chave }, { onConflict: "usuario_id,chave" })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
