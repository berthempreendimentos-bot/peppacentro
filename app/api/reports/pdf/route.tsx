import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"

import { createClient } from "@/lib/supabase/server"
import { ContratosPdfDocument, FinanceiroPdfDocument } from "@/lib/reports/pdf"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get("tipo") ?? "financeiro"
  const supabase = await createClient()

  if (tipo === "contratos") {
    const { data, error } = await supabase
      .from("contratos")
      .select("numero, situacao, valor_atual, data_fim, clientes(nome)")
      .order("numero")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const contratos = (data ?? []).map((c) => ({
      numero: c.numero,
      cliente: c.clientes?.nome ?? "",
      situacao: c.situacao,
      valorAtual: c.valor_atual,
      fim: c.data_fim,
    }))

    const buffer = await renderToBuffer(<ContratosPdfDocument contratos={contratos} />)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="contratos.pdf"',
      },
    })
  }

  const { data, error } = await supabase
    .from("lancamentos")
    .select("data, tipo, descricao, valor, status, contratos(numero)")
    .order("data", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const lancamentos = (data ?? []).map((l) => ({
    data: l.data,
    contrato: l.contratos?.numero ?? "",
    tipo: l.tipo,
    descricao: l.descricao,
    valor: l.valor,
    status: l.status,
  }))

  const entradas = new Set(["receita", "recebimento", "medicao"])
  const totalReceitas = lancamentos
    .filter((l) => entradas.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)
  const totalDespesas = lancamentos
    .filter((l) => !entradas.has(l.tipo))
    .reduce((acc, l) => acc + l.valor, 0)

  const buffer = await renderToBuffer(
    <FinanceiroPdfDocument
      lancamentos={lancamentos}
      totalReceitas={totalReceitas}
      totalDespesas={totalDespesas}
    />
  )
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="financeiro.pdf"',
    },
  })
}
