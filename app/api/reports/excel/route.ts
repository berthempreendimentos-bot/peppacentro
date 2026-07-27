import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { buildWorkbookBuffer } from "@/lib/reports/excel"

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get("tipo") ?? "financeiro"
  const supabase = await createClient()

  if (tipo === "contratos") {
    const { data, error } = await supabase
      .from("contratos")
      .select("numero, objeto, situacao, valor_inicial, valor_atual, data_inicio, data_fim, clientes(nome)")
      .order("numero")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? []).map((c) => ({
      Número: c.numero,
      Cliente: c.clientes?.nome ?? "",
      Objeto: c.objeto,
      Situação: c.situacao,
      "Valor Inicial": c.valor_inicial,
      "Valor Atual": c.valor_atual,
      Início: c.data_inicio,
      Fim: c.data_fim,
    }))

    const buffer = buildWorkbookBuffer([{ name: "Contratos", rows }])
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="contratos.xlsx"',
      },
    })
  }

  const { data, error } = await supabase
    .from("lancamentos")
    .select("data, tipo, descricao, valor, status, contratos(numero), categorias(nome)")
    .order("data", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []).map((l) => ({
    Data: l.data,
    Contrato: l.contratos?.numero ?? "",
    Tipo: l.tipo,
    Descrição: l.descricao,
    Categoria: l.categorias?.nome ?? "",
    Valor: l.valor,
    Status: l.status,
  }))

  const buffer = buildWorkbookBuffer([{ name: "Financeiro", rows }])
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="financeiro.xlsx"',
    },
  })
}
