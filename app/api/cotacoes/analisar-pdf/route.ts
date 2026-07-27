import { tmpdir } from "os"

import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import { createWorker, OEM } from "tesseract.js"

import { buscarEmpresaPorCnpj, extrairCnpj } from "@/lib/cnpj"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_PAGINAS_OCR = 2

async function extrairCnpjViaOcr(parser: PDFParse): Promise<string | null> {
  const screenshot = await parser.getScreenshot({ scale: 2, partial: [1, MAX_PAGINAS_OCR] })
  // cachePath aponta pro diretório temporário do SO — em serverless (Vercel)
  // só /tmp é gravável, e o padrão do pacote pode tentar escrever em
  // node_modules, o que falha nesse ambiente.
  const worker = await createWorker("por", OEM.LSTM_ONLY, { cachePath: tmpdir() })
  try {
    for (const pagina of screenshot.pages) {
      const { data } = await worker.recognize(Buffer.from(pagina.data))
      const cnpj = extrairCnpj(data.text)
      if (cnpj) return cnpj
    }
    return null
  } finally {
    await worker.terminate()
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
  }

  const data = new Uint8Array(await file.arrayBuffer())

  let texto = ""
  let cnpj: string | null = null
  try {
    const parser = new PDFParse({ data })
    const resultado = await parser.getText()
    texto = resultado.text
    cnpj = extrairCnpj(texto)

    // O CNPJ costuma aparecer só no timbre (logo), que é uma imagem sem
    // texto selecionável — nesse caso cai para OCR nas primeiras páginas.
    if (!cnpj) {
      try {
        cnpj = await extrairCnpjViaOcr(parser)
      } catch {
        cnpj = null
      }
    }

    await parser.destroy()
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o PDF" }, { status: 400 })
  }

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
