import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"

import { buscarEmpresaPorCnpj, extrairCnpj } from "@/lib/cnpj"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
  }

  const data = new Uint8Array(await file.arrayBuffer())

  let texto = ""
  try {
    const parser = new PDFParse({ data })
    const resultado = await parser.getText()
    texto = resultado.text
    await parser.destroy()
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o PDF" }, { status: 400 })
  }

  const cnpj = extrairCnpj(texto)
  let empresa = null
  if (cnpj) {
    try {
      empresa = await buscarEmpresaPorCnpj(cnpj)
    } catch {
      empresa = null
    }
  }

  return NextResponse.json({ texto, cnpj, empresa })
}
