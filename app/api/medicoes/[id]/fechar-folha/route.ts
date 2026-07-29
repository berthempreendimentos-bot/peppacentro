import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { buildFolhaPagamentoWorkbook } from "@/lib/reports/folha-excel"
import { lerTaxasDaUrl } from "@/lib/reports/taxas-url"
import { formatMesAno } from "@/lib/format"

export const runtime = "nodejs"
export const maxDuration = 30

const BUCKET = "contratos"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

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
  const safeName = nomeArquivo.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "").replace(/[^\w.\-]+/g, "_")
  const storagePath = `contrato_${medicao.contrato_id}/folha_pagamento/${medicao.competencia}_${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      upsert: false,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: documento, error: docError } = await supabase
    .from("documentos")
    .insert({
      contrato_id: medicao.contrato_id,
      nome: nomeArquivo,
      categoria: "folha_pagamento",
      storage_path: storagePath,
      tamanho: buffer.byteLength,
      referencia_tabela: "medicoes",
      referencia_id: medicao.id,
      uploaded_by: user.id,
    })
    .select("id")
    .single()
  if (docError) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from("medicoes")
    .update({ folha_documento_id: documento.id })
    .eq("id", medicao.id)
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ documentoId: documento.id })
}
