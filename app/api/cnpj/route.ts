import { NextRequest, NextResponse } from "next/server"

import { buscarEmpresaPorCnpj } from "@/lib/cnpj"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const cnpj = request.nextUrl.searchParams.get("cnpj") ?? ""

  try {
    const empresa = await buscarEmpresaPorCnpj(cnpj)
    if (!empresa) {
      return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 })
    }
    return NextResponse.json({ empresa })
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar o CNPJ" }, { status: 502 })
  }
}
