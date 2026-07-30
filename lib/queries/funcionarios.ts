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

      const { data: existentes } = await supabase
        .from("funcionarios")
        .select("id, nome, cpf")
        .eq("contrato_id", contratoId)

      if (existentes) {
        const duplicado = existentes.find(
          (e) =>
            e.nome.toLowerCase().trim() === input.nome.toLowerCase().trim() ||
            (input.cpf && e.cpf === input.cpf)
        )
        if (duplicado) {
          throw new Error(`Funcionário já cadastrado com este nome ou CPF (${duplicado.nome}).`)
        }
      }

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
      if (selecionados.length === 0) return { importados: 0, duplicados: 0, total: 0 }
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: existentes } = await supabase
        .from("funcionarios")
        .select("id, nome, cpf")
        .eq("contrato_id", contratoId)

      const existentesMap = new Map()
      if (existentes) {
        existentes.forEach((e) => {
          existentesMap.set(e.nome.toLowerCase().trim(), true)
          if (e.cpf) existentesMap.set(e.cpf, true)
        })
      }

      const selecionadosUnicos = []
      for (const f of selecionados) {
        const nomeKey = f.nome.toLowerCase().trim()
        if (existentesMap.has(nomeKey) || (f.cpf && existentesMap.has(f.cpf))) {
          continue
        }
        existentesMap.set(nomeKey, true)
        if (f.cpf) existentesMap.set(f.cpf, true)
        selecionadosUnicos.push(f)
      }

      const duplicados = selecionados.length - selecionadosUnicos.length
      if (selecionadosUnicos.length === 0) {
        return { importados: 0, duplicados, total: selecionados.length }
      }

      const { error } = await supabase.from("funcionarios").insert(
        selecionadosUnicos.map((f) => ({
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
        }))
      )
      if (error) throw error
      return { importados: selecionadosUnicos.length, duplicados, total: selecionados.length }
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
