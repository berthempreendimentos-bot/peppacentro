import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/lib/supabase/database.types"
import { QUERY_KEY as FUNCIONARIOS_QUERY_KEY } from "./funcionarios"

type OcorrenciaRow = Database["public"]["Tables"]["ocorrencias_funcionarios"]["Row"]
type OcorrenciaInsert = Database["public"]["Tables"]["ocorrencias_funcionarios"]["Insert"]

export type Ocorrencia = OcorrenciaRow

export const OCORRENCIAS_QUERY_KEY = (funcionarioId: string, mesReferencia: string) => ["ocorrencias", funcionarioId, mesReferencia]

export function useOcorrencias(funcionarioId: string | null, mesReferencia: string) {
  return useQuery({
    queryKey: OCORRENCIAS_QUERY_KEY(funcionarioId || "", mesReferencia),
    queryFn: async () => {
      if (!funcionarioId || !mesReferencia) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ocorrencias_funcionarios")
        .select("*")
        .eq("funcionario_id", funcionarioId)
        .eq("mes_referencia", mesReferencia)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as Ocorrencia[]
    },
    enabled: !!funcionarioId && !!mesReferencia,
  })
}

export function useCreateOcorrencia(funcionarioId: string, contratoId: string, mesReferencia: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { tipo: "falta" | "reembolso"; valor: number; descricao: string }) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("ocorrencias_funcionarios").insert({
        funcionario_id: funcionarioId,
        tipo: input.tipo,
        valor: input.valor,
        descricao: input.descricao,
        mes_referencia: mesReferencia,
        created_by: user?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate the occurrences list
      queryClient.invalidateQueries({ queryKey: OCORRENCIAS_QUERY_KEY(funcionarioId, mesReferencia) })
      // Invalidate the employees list to reflect the updated totals (done by DB trigger)
      queryClient.invalidateQueries({ queryKey: FUNCIONARIOS_QUERY_KEY(contratoId) })
    },
  })
}

export function useDeleteOcorrencia(funcionarioId: string, contratoId: string, mesReferencia: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from("ocorrencias_funcionarios").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OCORRENCIAS_QUERY_KEY(funcionarioId, mesReferencia) })
      queryClient.invalidateQueries({ queryKey: FUNCIONARIOS_QUERY_KEY(contratoId) })
    },
  })
}
