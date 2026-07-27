import { NextResponse } from "next/server"

import { buildWorkbookBuffer } from "@/lib/reports/excel"

export async function GET() {
  const rows = [
    {
      Nome: "João da Silva",
      CPF: "123.456.789-00",
      Cargo: "Vigilante",
      Admissão: "15/01/2024",
      "Salário Base": 2000,
    },
  ]

  const buffer = buildWorkbookBuffer([{ name: "Funcionários", rows }])
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-funcionarios.xlsx"',
    },
  })
}
