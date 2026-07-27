"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { CotacaoInput } from "@/lib/validations/cotacoes"
import type { Database } from "@/lib/supabase/database.types"

export type Cotacao = Database["public"]["Tables"]["cotacoes"]["Row"]
export type CotacaoItem = Database["public"]["Tables"]["cotacao_itens"]["Row"]
export type CotacaoEmpresa = Database["public"]["Tables"]["cotacao_empresas"]["Row"]
export type CotacaoPreco = Database["public"]["Tables"]["cotacao_precos"]["Row"]

export type CotacaoComDetalhes = Cotacao & {
  cotacao_itens: CotacaoItem[]
  cotacao_empresas: CotacaoEmpresa[]
}

const LIST_KEY = ["cotacoes"] as const
const DETAIL_KEY = (id: string) => ["cotacoes", id] as const

export function useCotacoes() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cotacoes")
        .select(
          "*, contratos(numero, clientes(nome)), cotacao_itens(id), cotacao_empresas(id)"
        )
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCotacao(id: string) {
  return useQuery({
    queryKey: DETAIL_KEY(id),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cotacoes")
        .select(
          "*, contratos(numero, clientes(nome)), cotacao_itens(*), cotacao_empresas(*)"
        )
        .eq("id", id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function usePrecos(cotacaoId: string) {
  return useQuery({
    queryKey: ["cotacoes", cotacaoId, "precos"],
    queryFn: async () => {
      const supabase = createClient()
      const { data: itens, error: itensError } = await supabase
        .from("cotacao_itens")
        .select("id")
        .eq("cotacao_id", cotacaoId)
      if (itensError) throw itensError
      const itemIds = itens.map((i) => i.id)
      if (itemIds.length === 0) return [] as CotacaoPreco[]
      const { data, error } = await supabase
        .from("cotacao_precos")
        .select("*")
        .in("cotacao_item_id", itemIds)
      if (error) throw error
      return data
    },
    enabled: !!cotacaoId,
  })
}

export function useCreateCotacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CotacaoInput) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("cotacoes")
        .insert({
          titulo: input.titulo,
          descricao: input.descricao || null,
          contrato_id: input.contrato_id || null,
          status: input.status,
          created_by: user?.id,
        })
        .select("id")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateCotacao(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CotacaoInput) => {
      const supabase = createClient()
      const { error } = await supabase
        .from("cotacoes")
        .update({
          titulo: input.titulo,
          descricao: input.descricao || null,
          contrato_id: input.contrato_id || null,
          status: input.status,
        })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY })
      queryClient.invalidateQueries({ queryKey: DETAIL_KEY(id) })
    },
  })
}

export function useDeleteCotacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("cotacoes").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAddItem(cotacaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { descricao: string; quantidade?: number; unidade?: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from("cotacao_itens").insert({
        cotacao_id: cotacaoId,
        descricao: input.descricao,
        quantidade: input.quantidade ?? 1,
        unidade: input.unidade || null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DETAIL_KEY(cotacaoId) }),
  })
}

export function useDeleteItem(cotacaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("cotacao_itens").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DETAIL_KEY(cotacaoId) }),
  })
}

export function useAddEmpresa(cotacaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { nome: string; cnpj?: string; contato?: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from("cotacao_empresas").insert({
        cotacao_id: cotacaoId,
        nome: input.nome,
        cnpj: input.cnpj || null,
        contato: input.contato || null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DETAIL_KEY(cotacaoId) }),
  })
}

export function useAddEmpresaComPdf(cotacaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      file: File
      nome: string
      cnpj?: string
      razaoSocial?: string
      situacaoCadastral?: string
      endereco?: string
      precos: { cotacaoItemId: string; valorUnitario: number }[]
      novosItens: { descricao: string; valorUnitario: number }[]
    }) => {
      const supabase = createClient()
      const safeName = input.file.name.replace(/[^\w.\-]+/g, "_")
      const storagePath = `cotacao_${cotacaoId}/${Date.now()}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from("contratos")
        .upload(storagePath, input.file, { upsert: false })
      if (uploadError) throw uploadError

      const { data: empresa, error: empresaError } = await supabase
        .from("cotacao_empresas")
        .insert({
          cotacao_id: cotacaoId,
          nome: input.nome,
          cnpj: input.cnpj || null,
          razao_social: input.razaoSocial || null,
          situacao_cadastral: input.situacaoCadastral || null,
          endereco: input.endereco || null,
          documento_storage_path: storagePath,
        })
        .select("id")
        .single()
      if (empresaError) {
        await supabase.storage.from("contratos").remove([storagePath])
        throw empresaError
      }

      let precosDeNovosItens: { cotacaoItemId: string; valorUnitario: number }[] = []
      if (input.novosItens.length > 0) {
        const { data: itensCriados, error: itensError } = await supabase
          .from("cotacao_itens")
          .insert(
            input.novosItens.map((item) => ({
              cotacao_id: cotacaoId,
              descricao: item.descricao,
              quantidade: 1,
            }))
          )
          .select("id")
        if (itensError) throw itensError
        precosDeNovosItens = itensCriados.map((item, idx) => ({
          cotacaoItemId: item.id,
          valorUnitario: input.novosItens[idx].valorUnitario,
        }))
      }

      const todosPrecos = [...input.precos, ...precosDeNovosItens]
      if (todosPrecos.length > 0) {
        const { error: precosError } = await supabase.from("cotacao_precos").upsert(
          todosPrecos.map((p) => ({
            cotacao_item_id: p.cotacaoItemId,
            cotacao_empresa_id: empresa.id,
            valor_unitario: p.valorUnitario,
          })),
          { onConflict: "cotacao_item_id,cotacao_empresa_id" }
        )
        if (precosError) throw precosError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DETAIL_KEY(cotacaoId) })
      queryClient.invalidateQueries({ queryKey: ["cotacoes", cotacaoId, "precos"] })
    },
  })
}

export function useDeleteEmpresa(cotacaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("cotacao_empresas").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DETAIL_KEY(cotacaoId) }),
  })
}

export function useSetPreco(cotacaoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      cotacaoItemId: string
      cotacaoEmpresaId: string
      valorUnitario: number | null
    }) => {
      const supabase = createClient()
      const { error } = await supabase.from("cotacao_precos").upsert(
        {
          cotacao_item_id: input.cotacaoItemId,
          cotacao_empresa_id: input.cotacaoEmpresaId,
          valor_unitario: input.valorUnitario,
        },
        { onConflict: "cotacao_item_id,cotacao_empresa_id" }
      )
      if (error) throw error
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cotacoes", cotacaoId, "precos"] }),
  })
}
