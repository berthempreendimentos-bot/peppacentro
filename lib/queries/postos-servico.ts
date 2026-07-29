"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import { somarModulo, type ItemSimples, type LinhaPlanilha } from "@/lib/xlsx/analyze"
import type { Database } from "@/lib/supabase/database.types"

export type PostoServico = Database["public"]["Tables"]["postos_servico"]["Row"]
export type PostoEpi = Database["public"]["Tables"]["posto_epis"]["Row"]
export type Ferramenta = Database["public"]["Tables"]["ferramentas"]["Row"]
export type PostoCustoItem = Database["public"]["Tables"]["posto_custo_itens"]["Row"]
export type PostoServicoComItens = PostoServico & {
  posto_epis: PostoEpi[]
  ferramentas: Ferramenta[]
  posto_custo_itens: PostoCustoItem[]
}

const QUERY_KEY = (contratoId: string) => ["postos-servico", contratoId] as const

export function usePostosServico(contratoId: string) {
  return useQuery({
    queryKey: QUERY_KEY(contratoId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("postos_servico")
        .select("*, posto_epis(*), ferramentas(*), posto_custo_itens(*)")
        .eq("contrato_id", contratoId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as PostoServicoComItens[]
    },
    enabled: !!contratoId,
  })
}

export function useDocumentosPlanilha(contratoId: string) {
  return useQuery({
    queryKey: ["documentos-planilha", contratoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documentos")
        .select("id, nome, storage_path, created_at")
        .eq("contrato_id", contratoId)
        .eq("categoria", "planilha")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

type ImportarPostoInput = {
  nome: string
  quantidade: number
  documentoId: string
  abaOrigem: string
  linhas: LinhaPlanilha[]
}

export function useImportarPosto(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ImportarPostoInput) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const modulo1 = somarModulo(input.linhas, 1)
      const modulo2 = somarModulo(input.linhas, 2)
      const modulo3 = somarModulo(input.linhas, 3)
      const modulo4 = somarModulo(input.linhas, 4)
      const modulo5 = somarModulo(input.linhas, 5)
      const modulo6 = somarModulo(input.linhas, 6)
      const valorTotal =
        (modulo1 + modulo2 + modulo3 + modulo4 + modulo5 + modulo6) * (input.quantidade || 1)

      const { data: posto, error: postoError } = await supabase
        .from("postos_servico")
        .insert({
          contrato_id: contratoId,
          nome: input.nome,
          quantidade: input.quantidade || 1,
          modulo_1_remuneracao: modulo1,
          modulo_2_encargos_beneficios: modulo2,
          modulo_3_provisao_rescisao: modulo3,
          modulo_4_reposicao: modulo4,
          modulo_5_insumos: modulo5,
          modulo_6_indiretos_tributos_lucro: modulo6,
          valor_total: valorTotal,
          documento_id: input.documentoId,
          aba_origem: input.abaOrigem,
          created_by: user?.id,
        })
        .select("id")
        .single()
      if (postoError) throw postoError

      const epis = input.linhas.filter((l) => l.categoria === "epi")
      if (epis.length > 0) {
        const { error } = await supabase.from("posto_epis").insert(
          epis.map((l) => ({
            posto_servico_id: posto.id,
            nome: l.descricao,
            quantidade: l.quantidade ?? 1,
            valor: l.valor,
          }))
        )
        if (error) throw error
      }

      const ferramentas = input.linhas.filter((l) => l.categoria === "ferramenta")
      if (ferramentas.length > 0) {
        const { error } = await supabase.from("ferramentas").insert(
          ferramentas.map((l) => ({
            posto_servico_id: posto.id,
            nome: l.descricao,
            quantidade: l.quantidade ?? 1,
            valor_unitario: l.valor,
            valor_total: l.valor !== null ? l.valor * (l.quantidade ?? 1) : null,
          }))
        )
        if (error) throw error
      }

      const itensModulo = input.linhas.filter(
        (l) => l.categoria.startsWith("modulo_") && !l.ehTotalModulo
      )
      if (itensModulo.length > 0) {
        const { error } = await supabase.from("posto_custo_itens").insert(
          itensModulo.map((l) => ({
            posto_servico_id: posto.id,
            modulo: Number(l.categoria.replace("modulo_", "")),
            descricao: l.descricao,
            valor: l.valor ?? 0,
          }))
        )
        if (error) throw error
      }

      return posto.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

type ReimportarPostoInput = {
  postoId: string
  nome: string
  quantidade: number
  documentoId: string
  abaOrigem: string
  linhas: LinhaPlanilha[]
}

export function useReimportarPosto(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ReimportarPostoInput) => {
      const supabase = createClient()

      const modulo1 = somarModulo(input.linhas, 1)
      const modulo2 = somarModulo(input.linhas, 2)
      const modulo3 = somarModulo(input.linhas, 3)
      const modulo4 = somarModulo(input.linhas, 4)
      const modulo5 = somarModulo(input.linhas, 5)
      const modulo6 = somarModulo(input.linhas, 6)
      const valorTotal =
        (modulo1 + modulo2 + modulo3 + modulo4 + modulo5 + modulo6) * (input.quantidade || 1)

      const { error: updateError } = await supabase
        .from("postos_servico")
        .update({
          nome: input.nome,
          quantidade: input.quantidade || 1,
          modulo_1_remuneracao: modulo1,
          modulo_2_encargos_beneficios: modulo2,
          modulo_3_provisao_rescisao: modulo3,
          modulo_4_reposicao: modulo4,
          modulo_5_insumos: modulo5,
          modulo_6_indiretos_tributos_lucro: modulo6,
          valor_total: valorTotal,
          documento_id: input.documentoId,
          aba_origem: input.abaOrigem,
        })
        .eq("id", input.postoId)
      if (updateError) throw updateError

      const { error: delError } = await supabase
        .from("posto_custo_itens")
        .delete()
        .eq("posto_servico_id", input.postoId)
      if (delError) throw delError

      const itensModulo = input.linhas.filter(
        (l) => l.categoria.startsWith("modulo_") && !l.ehTotalModulo
      )
      if (itensModulo.length > 0) {
        const { error } = await supabase.from("posto_custo_itens").insert(
          itensModulo.map((l) => ({
            posto_servico_id: input.postoId,
            modulo: Number(l.categoria.replace("modulo_", "")),
            descricao: l.descricao,
            valor: l.valor ?? 0,
          }))
        )
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useUpdatePostoQuantidade(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ posto, quantidade }: { posto: PostoServico; quantidade: number }) => {
      const supabase = createClient()
      const somaModulos =
        posto.modulo_1_remuneracao +
        posto.modulo_2_encargos_beneficios +
        posto.modulo_3_provisao_rescisao +
        posto.modulo_4_reposicao +
        posto.modulo_5_insumos +
        posto.modulo_6_indiretos_tributos_lucro
      const { error } = await supabase
        .from("postos_servico")
        .update({ quantidade, valor_total: somaModulos * quantidade })
        .eq("id", posto.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useDeletePosto(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("postos_servico").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useAddEpi(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { postoServicoId: string; nome: string; quantidade?: number; valor?: number }) => {
      const supabase = createClient()
      const { error } = await supabase.from("posto_epis").insert({
        posto_servico_id: input.postoServicoId,
        nome: input.nome,
        quantidade: input.quantidade ?? 1,
        valor: input.valor ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useImportarEpis(contratoId: string, postoServicoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      documentoId: string
      abaOrigem: string
      itens: ItemSimples[]
    }) => {
      const supabase = createClient()
      const selecionados = input.itens.filter((i) => i.incluir)
      if (selecionados.length === 0) return
      const { error } = await supabase.from("posto_epis").insert(
        selecionados.map((i) => ({
          posto_servico_id: postoServicoId,
          nome: i.descricao,
          quantidade: i.quantidade ?? 1,
          valor: i.valor,
        }))
      )
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useDeleteEpi(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("posto_epis").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useAddFerramenta(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      postoServicoId: string
      nome: string
      quantidade?: number
      valorUnitario?: number
    }) => {
      const supabase = createClient()
      const quantidade = input.quantidade ?? 1
      const { error } = await supabase.from("ferramentas").insert({
        posto_servico_id: input.postoServicoId,
        nome: input.nome,
        quantidade,
        valor_unitario: input.valorUnitario ?? null,
        valor_total: input.valorUnitario ? input.valorUnitario * quantidade : null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useDeleteFerramenta(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("ferramentas").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}

export function useDeletePostoCustoItem(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      
      const { data: item, error: fetchError } = await supabase
        .from("posto_custo_itens")
        .select("valor, modulo, posto_servico_id")
        .eq("id", id)
        .single()
      
      if (fetchError) throw fetchError

      const { error: deleteError } = await supabase.from("posto_custo_itens").delete().eq("id", id)
      if (deleteError) throw deleteError

      if (item) {
        const { data: posto, error: postoError } = await supabase
          .from("postos_servico")
          .select("*")
          .eq("id", item.posto_servico_id)
          .single()
          
        if (postoError) throw postoError

        if (posto) {
          const moduloMap: Record<number, keyof PostoServico> = {
            1: "modulo_1_remuneracao",
            2: "modulo_2_encargos_beneficios",
            3: "modulo_3_provisao_rescisao",
            4: "modulo_4_reposicao",
            5: "modulo_5_insumos",
            6: "modulo_6_indiretos_tributos_lucro",
          }
          
          const coluna = moduloMap[item.modulo]
          if (coluna) {
            const valorAtual = Number(posto[coluna]) || 0
            const novoValor = valorAtual - item.valor
            
            const somaModulos = 
              (coluna === "modulo_1_remuneracao" ? novoValor : Number(posto.modulo_1_remuneracao)) +
              (coluna === "modulo_2_encargos_beneficios" ? novoValor : Number(posto.modulo_2_encargos_beneficios)) +
              (coluna === "modulo_3_provisao_rescisao" ? novoValor : Number(posto.modulo_3_provisao_rescisao)) +
              (coluna === "modulo_4_reposicao" ? novoValor : Number(posto.modulo_4_reposicao)) +
              (coluna === "modulo_5_insumos" ? novoValor : Number(posto.modulo_5_insumos)) +
              (coluna === "modulo_6_indiretos_tributos_lucro" ? novoValor : Number(posto.modulo_6_indiretos_tributos_lucro))
              
            const novoTotal = somaModulos * (posto.quantidade || 1)
            
            const { error: updateError } = await supabase
              .from("postos_servico")
              .update({
                [coluna]: novoValor,
                valor_total: novoTotal,
              } as Partial<Database["public"]["Tables"]["postos_servico"]["Update"]>)
              .eq("id", item.posto_servico_id)
              
            if (updateError) throw updateError
          }
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY(contratoId) }),
  })
}
