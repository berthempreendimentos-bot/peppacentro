"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"
import type { DocumentoInput } from "@/lib/validations/documentos"
import type { Database } from "@/lib/supabase/database.types"

export type Documento = Database["public"]["Tables"]["documentos"]["Row"]

const BUCKET = "contratos"

export function useDocumentos(contratoId: string) {
  return useQuery({
    queryKey: ["documentos", contratoId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!contratoId,
  })
}

export function useDocumentosGlobal() {
  return useQuery({
    queryKey: ["documentos", "global"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("documentos")
        .select("*, contratos(numero, clientes(nome))")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useUploadDocumento(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, input }: { file: File; input: DocumentoInput }) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const safeName = file.name.replace(/[^\w.\-]+/g, "_")
      const storagePath = `contrato_${contratoId}/${input.categoria}/${Date.now()}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, { upsert: false })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from("documentos").insert({
        contrato_id: contratoId,
        nome: input.nome,
        categoria: input.categoria,
        storage_path: storagePath,
        tamanho: file.size,
        validade: input.validade || null,
        uploaded_by: user?.id,
      })
      if (insertError) {
        await supabase.storage.from(BUCKET).remove([storagePath])
        throw insertError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["documentos", "global"] })
    },
  })
}

export function useDownloadDocumento() {
  return useMutation({
    mutationFn: async (storagePath: string) => {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 60)
      if (error) throw error
      return data.signedUrl
    },
  })
}

export function useDeleteDocumento(contratoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (documento: Documento) => {
      const supabase = createClient()
      await supabase.storage.from(BUCKET).remove([documento.storage_path])
      const { error } = await supabase.from("documentos").delete().eq("id", documento.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", contratoId] })
      queryClient.invalidateQueries({ queryKey: ["documentos", "global"] })
    },
  })
}
