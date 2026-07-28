import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { buildEspelhoMedicaoWorkbook } from "@/lib/reports/excel-espelho-medicao"
import { contentDispositionAnexo, formatDate } from "@/lib/format"

export const runtime = "nodejs"
export const maxDuration = 30

function ultimoDiaDoMes(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number)
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: medicao, error: medicaoError } = await supabase
    .from("medicoes")
    .select("*, contratos(numero, objeto, data_inicio, iss_aliquota, clientes(nome, endereco, cpf_cnpj, praca_pagamento))")
    .eq("id", id)
    .maybeSingle()

  if (medicaoError) {
    return NextResponse.json({ error: medicaoError.message }, { status: 500 })
  }
  if (!medicao) {
    return NextResponse.json({ error: "Medição não encontrada" }, { status: 404 })
  }

  const contrato = medicao.contratos
  const cliente = contrato?.clientes

  const buffer = await buildEspelhoMedicaoWorkbook({
    clienteNome: cliente?.nome ?? "—",
    clienteEndereco: cliente?.endereco ?? null,
    clientePracaPagamento: cliente?.praca_pagamento ?? null,
    clienteCpfCnpj: cliente?.cpf_cnpj ?? null,
    contratoNumero: contrato?.numero ?? "—",
    objetoContrato: contrato?.objeto ?? "",
    dataInicioContrato: contrato?.data_inicio ?? null,
    periodoInicio: formatDate(medicao.competencia),
    periodoFim: formatDate(ultimoDiaDoMes(medicao.competencia)),
    numeroMedicao: medicao.numero,
    valorContrato: medicao.valor_contrato,
    maoDeObra: medicao.mao_de_obra,
    valeTransporte: medicao.vale_transporte,
    valeRefeicao: medicao.vale_refeicao,
    material: medicao.material,
    issAliquota: contrato?.iss_aliquota ?? 5,
  })

  const nomeArquivo = `Espelho de Medicao ${medicao.numero} - Contrato ${contrato?.numero ?? ""}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionAnexo(nomeArquivo),
    },
  })
}
