"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

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
