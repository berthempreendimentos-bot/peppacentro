"use client"

import { useQuery } from "@tanstack/react-query"

import { createClient } from "@/lib/supabase/client"

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc("dashboard_kpis")
      if (error) throw error
      return data[0]
    },
  })
}

export function useDashboardTotalPostos() {
  return useQuery({
    queryKey: ["dashboard", "total-postos"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("postos_servico").select("quantidade")
      if (error) throw error
      return data.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)
    },
  })
}

export function useFinanceiroMensal() {
  return useQuery({
    queryKey: ["dashboard", "financeiro-mensal"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("view_financeiro_mensal").select("*")
      if (error) throw error
      return data
    },
  })
}

export function useGastosPorCategoria() {
  return useQuery({
    queryKey: ["dashboard", "gastos-categoria"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("view_gastos_por_categoria")
        .select("*")
      if (error) throw error
      return data
    },
  })
}

export function useSituacaoContratos() {
  return useQuery({
    queryKey: ["dashboard", "situacao-contratos"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("view_situacao_contratos").select("*")
      if (error) throw error
      return data
    },
  })
}

export function useContratosPorCliente() {
  return useQuery({
    queryKey: ["dashboard", "contratos-cliente"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("view_contratos_por_cliente")
        .select("*")
      if (error) throw error
      return data
    },
  })
}
