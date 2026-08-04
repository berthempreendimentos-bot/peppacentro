import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"

import { createClient } from "@/lib/supabase/server"
import { ResumoFinanceiroPdfDocument } from "@/lib/reports/pdf-resumo-financeiro"
import { contentDispositionAnexo } from "@/lib/format"

export const runtime = "nodejs"
export const maxDuration = 30

function formatMesReferencia(yyyyMM: string) {
  if (!yyyyMM) return ""
  const [ano, mes] = yyyyMM.split("-")
  const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
  return `${meses[parseInt(mes, 10) - 1]}/${ano}`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mes = searchParams.get("mes")
  const contratosStr = searchParams.get("contratos")

  if (!mes || !contratosStr) {
    return NextResponse.json({ error: "Parâmetros mes e contratos são obrigatórios" }, { status: 400 })
  }

  const contratosSelecionados = contratosStr.split(",")

  const supabase = await createClient()

  // Buscar Medições globais
  const { data: medicoes, error: medicoesError } = await supabase
    .from("medicoes")
    .select("*")

  // Buscar Lançamentos globais
  const { data: lancamentos, error: lancamentosError } = await supabase
    .from("lancamentos")
    .select("*")
    .neq("status", "cancelado")

  const { data: contratos, error: contratosError } = await supabase
    .from("contratos")
    .select("id, numero, clientes(nome)")
    .in("id", contratosSelecionados)

  if (medicoesError || lancamentosError || contratosError) {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }

  // Filtrar Medições
  const medicoesMes = (medicoes || []).filter(
    (m) => m.competencia?.substring(0, 7) === mes && m.contrato_id && contratosSelecionados.includes(m.contrato_id)
  )

  // Filtrar Lançamentos
  const lancamentosMes = (lancamentos || []).filter(
    (l) => {
      const lMes = (l.mes_referencia || l.data).substring(0, 7)
      return lMes === mes && l.contrato_id && contratosSelecionados.includes(l.contrato_id)
    }
  )

  const valorMedicao = medicoesMes.reduce((acc, m) => acc + (m.valor || 0), 0)
  const valorRetencao = medicoesMes.reduce((acc, m) => acc + ((m.valor || 0) - (m.valor_liquido || 0)), 0)
  const valorLiquido = medicoesMes.reduce((acc, m) => acc + (m.valor_liquido || 0), 0)

  const ENTRADAS = new Set(["receita", "recebimento"])
  
  const lancamentosGastos = lancamentosMes.filter((l) => !ENTRADAS.has(l.tipo) && l.tipo !== "medicao")
  const totalGastos = lancamentosGastos.reduce((acc, l) => acc + l.valor, 0)
    
  const pagamentoContrato = lancamentosMes
    .filter((l) => ENTRADAS.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)

  const nomesContratos = (contratos || []).map((c: any) => `${c.numero} - ${c.clientes?.nome || "Sem nome"}`)

  const buffer = await renderToBuffer(
    <ResumoFinanceiroPdfDocument
      mesReferencia={formatMesReferencia(mes)}
      valorMedicao={valorMedicao}
      valorRetencao={valorRetencao}
      valorLiquido={valorLiquido}
      totalGastos={totalGastos}
      pagamentoContrato={pagamentoContrato}
      nomesContratos={nomesContratos}
      gastos={lancamentosGastos.map((g) => ({
        data: g.data,
        descricao: g.descricao,
        valor: g.valor
      }))}
    />
  )

  const nomeArquivo = `Resumo Financeiro - ${mes}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionAnexo(nomeArquivo),
    },
  })
}
