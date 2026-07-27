import { tmpdir } from "os"

import { createCanvas, loadImage } from "@napi-rs/canvas"
import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import { createWorker, OEM } from "tesseract.js"

import { buscarEmpresaPorCnpj, extrairCnpj } from "@/lib/cnpj"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_PAGINAS_OCR = 2

// Timbres/logos costumam ter o endereço e o CNPJ em cinza bem claro, baixo
// contraste com o fundo branco — o que o OCR não reconhece direito. Binariza
// a imagem (qualquer coisa que não seja quase-branco vira preto) antes do
// OCR pra realçar esse texto claro.
async function realcarContraste(png: Uint8Array): Promise<Buffer> {
  const imagem = await loadImage(Buffer.from(png))
  const canvas = createCanvas(imagem.width, imagem.height)
  const ctx = canvas.getContext("2d")
  ctx.drawImage(imagem, 0, 0)
  const imageData = ctx.getImageData(0, 0, imagem.width, imagem.height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    const cinza = (d[i] + d[i + 1] + d[i + 2]) / 3
    const valor = cinza > 235 ? 255 : 0
    d[i] = d[i + 1] = d[i + 2] = valor
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toBuffer("image/png")
}

async function extrairCnpjViaOcr(parser: PDFParse): Promise<string | null> {
  const screenshot = await parser.getScreenshot({ scale: 3, partial: [1, MAX_PAGINAS_OCR] })
  // cachePath aponta pro diretório temporário do SO — em serverless (Vercel)
  // só /tmp é gravável, e o padrão do pacote pode tentar escrever em
  // node_modules, o que falha nesse ambiente.
  const worker = await createWorker("por", OEM.LSTM_ONLY, { cachePath: tmpdir() })
  try {
    for (const pagina of screenshot.pages) {
      const imagemRealcada = await realcarContraste(pagina.data)
      const { data } = await worker.recognize(imagemRealcada)
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
