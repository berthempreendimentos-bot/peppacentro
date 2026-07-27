"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { ItemSimples } from "@/lib/xlsx/analyze"
import type { Database } from "@/lib/supabase/database.types"

type TabelaLista = "ferramentas_contrato" | "servicos_contrato"

export type ItemListaContrato = Database["public"]["Tables"]["ferramentas_contrato"]["Row"]

type ImportarItensInput = {
  documentoId: string
  abaOrigem: string
  itens: ItemSimples[]
}

// Ferramentas e Serviços do contrato têm exatamente a mesma estrutura
// (nome, quantidade, valor unitário/total, origem da planilha), então
// compartilham a mesma implementação de queries/mutations.
export function criarQueriesListaContrato(tabela: TabelaLista) {
  const queryKey = (contratoId: string) => [tabela, contratoId] as const

  function useLista(contratoId: string) {
    return useQuery({
      queryKey: queryKey(contratoId),
      queryFn: async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from(tabela)
          .select("*")
          .eq("contrato_id", contratoId)
          .order("created_at", { ascending: false })
        if (error) throw error
        return data
      },
      enabled: !!contratoId,
    })
  }

  function useAdicionarItem(contratoId: string) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (input: { nome: string; quantidade?: number; valorUnitario?: number }) => {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const quantidade = input.quantidade ?? 1
        const { error } = await supabase.from(tabela).insert({
          contrato_id: contratoId,
          nome: input.nome,
          quantidade,
          valor_unitario: input.valorUnitario ?? null,
          valor_total: input.valorUnitario ? input.valorUnitario * quantidade : 0,
          created_by: user?.id,
        })
        if (error) throw error
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(contratoId) }),
    })
  }

  function useImportarItens(contratoId: string) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (input: ImportarItensInput) => {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const selecionados = input.itens.filter((i) => i.incluir)
        if (selecionados.length === 0) return
        const { error } = await supabase.from(tabela).insert(
          selecionados.map((item) => ({
            contrato_id: contratoId,
            nome: item.descricao,
            quantidade: item.quantidade ?? 1,
            valor_unitario: item.valor,
            valor_total: (item.valor ?? 0) * (item.quantidade ?? 1),
            documento_id: input.documentoId,
            aba_origem: input.abaOrigem,
            created_by: user?.id,
          }))
        )
        if (error) throw error
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(contratoId) }),
    })
  }

  function useExcluirItem(contratoId: string) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (id: string) => {
        const supabase = createClient()
        const { error } = await supabase.from(tabela).delete().eq("id", id)
        if (error) throw error
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKey(contratoId) }),
    })
  }

  return { useLista, useAdicionarItem, useImportarItens, useExcluirItem }
}
