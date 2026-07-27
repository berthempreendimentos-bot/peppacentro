"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { FuncionarioInput } from "@/lib/validations/funcionarios"
import type { Database } from "@/lib/supabase/database.types"

export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"]

const QUERY_KEY = (contratoId: string) => ["funcionarios", contratoId] as const

export function useFuncionarios(contratoId: string) {
  return useQuery({
    queryKey: QUERY_KEY(contratoId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("nome")
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

export function useCreateFuncionario(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: FuncionarioInput) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase.from("funcionarios").insert({
        contrato_id: contratoId,
        nome: input.nome,
        cpf: input.cpf || null,
        funcao: input.funcao || null,
        data_admissao: input.data_admissao || null,
        salario_base: input.salario_base,
        vt_informado: input.vt_informado,
        vr_informado: input.vr_informado,
        recebe_periculosidade: input.recebe_periculosidade,
        inss_percentual: input.inss_percentual,
        created_by: user?.id,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useUpdateFuncionario(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FuncionarioInput }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("funcionarios")
        .update({
          nome: input.nome,
          cpf: input.cpf || null,
          funcao: input.funcao || null,
          data_admissao: input.data_admissao || null,
          salario_base: input.salario_base,
          vt_informado: input.vt_informado,
          vr_informado: input.vr_informado,
          recebe_periculosidade: input.recebe_periculosidade,
          inss_percentual: input.inss_percentual,
        })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useDeleteFuncionario(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("funcionarios").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}
