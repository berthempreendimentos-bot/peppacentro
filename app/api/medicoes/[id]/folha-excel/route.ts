import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { buildFolhaPagamentoWorkbook } from "@/lib/reports/folha-excel"
import { lerTaxasDaUrl } from "@/lib/reports/taxas-url"
import { contentDispositionAnexo, formatMesAno } from "@/lib/format"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: medicao, error: medicaoError } = await supabase
    .from("medicoes")
    .select("id, contrato_id, competencia, numero")
    .eq("id", id)
    .maybeSingle()
  if (medicaoError) {
    return NextResponse.json({ error: medicaoError.message }, { status: 500 })
  }
  if (!medicao) {
    return NextResponse.json({ error: "Medição não encontrada" }, { status: 404 })
  }

  const [{ data: contrato }, { data: funcionarios, error: funcError }] = await Promise.all([
    supabase.from("contratos").select("numero, clientes(nome)").eq("id", medicao.contrato_id).maybeSingle(),
    supabase.from("funcionarios").select("*").eq("contrato_id", medicao.contrato_id).order("nome"),
  ])
  if (funcError) {
    return NextResponse.json({ error: funcError.message }, { status: 500 })
  }

  const taxas = lerTaxasDaUrl(request.nextUrl.searchParams)
  const contratoTitulo = contrato
    ? `Contrato Nº ${contrato.numero}${contrato.clientes?.nome ? ` — ${contrato.clientes.nome}` : ""}`
    : "Contrato"
  const [ano, mes] = medicao.competencia.split("-")
  const mesReferencia = formatMesAno(new Date(Number(ano), Number(mes) - 1, 1))

  const buffer = await buildFolhaPagamentoWorkbook({
    contratoTitulo,
    mesReferencia,
    funcionarios: funcionarios ?? [],
    taxas,
  })

  const nomeArquivo = `Folha de Pagamento - ${contrato?.numero ?? "Contrato"} - ${mesReferencia}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionAnexo(nomeArquivo),
    },
  })
}
