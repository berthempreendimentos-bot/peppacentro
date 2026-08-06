"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { LancamentoInput } from "@/lib/validations/lancamentos"
import type { Database } from "@/lib/supabase/database.types"

export type Lancamento = Database["public"]["Tables"]["lancamentos"]["Row"]

const JOIN_SELECT =
  "*, categorias(nome), fornecedores(nome), centro_custos(nome)"

export function useLancamentos(contratoId: string) {
  return useQuery({
    queryKey: ["lancamentos", contratoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("lancamentos")
        .select(JOIN_SELECT)
        .eq("contrato_id", contratoId)
        .order("data", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

export function useLancamentosGlobal() {
  return useQuery({
    queryKey: ["lancamentos", "global"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("lancamentos")
        .select(`${JOIN_SELECT}, contratos(numero, clientes(nome))`)
        .order("data", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function normalize(input: LancamentoInput) {
  return {
    ...input,
    categoria_id: input.categoria_id || null,
    fornecedor_id: input.fornecedor_id || null,
    centro_custo_id: input.centro_custo_id || null,
    mes_referencia: input.mes_referencia || null,
  }
}

const NF_BUCKET = "contratos"

async function uploadNotaFiscal(contratoId: string, file: File) {
  const supabase = createClient()
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const storagePath = `contrato_${contratoId}/nota_fiscal/${Date.now()}_${safeName}`
  const { error } = await supabase.storage.from(NF_BUCKET).upload(storagePath, file, {
    upsert: false,
  })
  if (error) throw error
  return { storagePath, nome: file.name, tamanho: file.size }
}

export function useDocumentosLancamento(lancamentoId: string | undefined) {
  return useQuery({
    queryKey: ["lancamentos", "documentos", lancamentoId],
    queryFn: async () => {
      if (!lancamentoId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("referencia_tabela", "lancamentos")
        .eq("referencia_id", lancamentoId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!lancamentoId,
  })
}

export function useCreateLancamento(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, files }: { input: LancamentoInput; files?: File[] }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: lancamento, error } = await supabase.from("lancamentos").insert({
        ...normalize(input),
        contrato_id: contratoId,
        documento_url: null, // Legacy field not used for new multi-file
      }).select("id").single()
      
      if (error) throw error

      if (files && files.length > 0) {
        const uploads = await Promise.all(files.map(f => uploadNotaFiscal(contratoId, f)))
        const docs = uploads.map(u => ({
          contrato_id: contratoId,
          nome: u.nome,
          categoria: "nota_fiscal" as const,
          storage_path: u.storagePath,
          tamanho: u.tamanho,
          referencia_tabela: "lancamentos",
          referencia_id: lancamento.id,
          uploaded_by: user?.id,
        }))
        const { error: docError } = await supabase.from("documentos").insert(docs)
        if (docError) throw docError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["lancamentos", "global"] })
    },
  })
}

export function useUpdateLancamento(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      input,
      filesToAdd,
    }: {
      id: string
      input: LancamentoInput
      filesToAdd?: File[]
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("lancamentos")
        .update(normalize(input))
        .eq("id", id)
      if (error) throw error

      if (filesToAdd && filesToAdd.length > 0) {
        const uploads = await Promise.all(filesToAdd.map(f => uploadNotaFiscal(contratoId, f)))
        const docs = uploads.map(u => ({
          contrato_id: contratoId,
          nome: u.nome,
          categoria: "nota_fiscal" as const,
          storage_path: u.storagePath,
          tamanho: u.tamanho,
          referencia_tabela: "lancamentos",
          referencia_id: id,
          uploaded_by: user?.id,
        }))
        const { error: docError } = await supabase.from("documentos").insert(docs)
        if (docError) throw docError
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["lancamentos", "global"] })
      queryClient.invalidateQueries({ queryKey: ["lancamentos", "documentos", variables.id] })
    },
  })
}

export function useDeleteDocumentoLancamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      const supabase = createClient()
      // Exclui do banco
      const { error: dbError } = await supabase.from("documentos").delete().eq("id", id)
      if (dbError) throw dbError
      // Exclui do storage
      await supabase.storage.from(NF_BUCKET).remove([storagePath])
    },
    onSuccess: () => {
      // Idealmente precisaríamos do lancamentoId para invalidar a lista certa,
      // mas como é uma exclusão de anexo, invalidar queries relacionadas já ajuda.
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] })
    },
  })
}

export function useDeleteLancamento(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("lancamentos").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["lancamentos", "global"] })
    },
  })
}
