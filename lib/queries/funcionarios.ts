"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { FuncionarioInput } from "@/lib/validations/funcionarios"
import type { FuncionarioImportado } from "@/lib/xlsx/funcionarios-import"
import type { Database } from "@/lib/supabase/database.types"

export type Funcionario = Database["public"]["Tables"]["funcionarios"]["Row"]

export const QUERY_KEY = (contratoId: string) => ["funcionarios", contratoId] as const

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
        matricula: input.matricula || null,
        faltas: input.faltas || 0,
        reembolso: input.reembolso || 0,
        reembolso_creche: input.reembolso_creche || 0,
        salario_base: input.salario_base,
        vt_informado: input.vt_informado,
        vr_informado: input.vr_informado,
        recebe_periculosidade: input.recebe_periculosidade,
        grau_insalubridade: input.grau_insalubridade,
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
          matricula: input.matricula || null,
          faltas: input.faltas || 0,
          reembolso: input.reembolso || 0,
          reembolso_creche: input.reembolso_creche || 0,
          salario_base: input.salario_base,
          vt_informado: input.vt_informado,
          vr_informado: input.vr_informado,
          recebe_periculosidade: input.recebe_periculosidade,
          grau_insalubridade: input.grau_insalubridade,
        })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useImportFuncionarios(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (funcionarios: FuncionarioImportado[]) => {
      const selecionados = funcionarios.filter((f) => f.incluir)
      if (selecionados.length === 0) return
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase.from("funcionarios").upsert(
        selecionados.map((f) => ({
          contrato_id: contratoId,
          nome: f.nome,
          matricula: f.matricula || null,
          cpf: f.cpf || null,
          funcao: f.funcao || null,
          data_admissao: f.dataAdmissao || null,
          salario_base: f.salarioBase,
          vt_informado: f.vtInformado,
          vr_informado: f.vrInformado,
          reembolso_creche: f.reembolsoCreche || 0,
          recebe_periculosidade: false,
          grau_insalubridade: "nenhum" as const,
          created_by: user?.id,
        })),
        { onConflict: "contrato_id,cpf" }
      )
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

export function useUpdateFaltasReembolsoEmLote(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (atualizacoes: { id: string; faltas: number; reembolso: number }[]) => {
      const supabase = createClient()
      const { error } = await supabase.rpc("update_faltas_reembolso_em_lote", {
        atualizacoes,
      })
      if (error) {
        // Fallback for sequential updates if the RPC doesn't exist
        for (const auth of atualizacoes) {
          await supabase
            .from("funcionarios")
            .update({ faltas: auth.faltas, reembolso: auth.reembolso })
            .eq("id", auth.id)
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}
