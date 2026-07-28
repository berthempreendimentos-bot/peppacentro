import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { buildFolhaPagamentoWorkbook } from "@/lib/reports/folha-excel"
import { contentDispositionAnexo, formatMesAno } from "@/lib/format"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contrato }, { data: funcionarios, error }] = await Promise.all([
    supabase.from("contratos").select("numero, clientes(nome)").eq("id", id).maybeSingle(),
    supabase.from("funcionarios").select("*").eq("contrato_id", id).order("nome"),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const contratoTitulo = contrato
    ? `Contrato Nº ${contrato.numero}${contrato.clientes?.nome ? ` — ${contrato.clientes.nome}` : ""}`
    : "Contrato"
  const mesReferencia = formatMesAno()

  const buffer = await buildFolhaPagamentoWorkbook({
    contratoTitulo,
    mesReferencia,
    funcionarios: funcionarios ?? [],
  })

  const nomeArquivo = `Folha de Pagamento - ${contrato?.numero ?? "Contrato"} - ${mesReferencia}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionAnexo(nomeArquivo),
    },
  })
}
