import { NextResponse } from "next/server"

import { buildWorkbookBuffer } from "@/lib/reports/excel"

export async function GET() {
  const rows = [
    {
      Nome: "João da Silva",
      CPF: "123.456.789-00",
      Valor: 80,
    },
  ]

  const buffer = buildWorkbookBuffer([{ name: "ASO", rows }])
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-aso.xlsx"',
    },
  })
}
