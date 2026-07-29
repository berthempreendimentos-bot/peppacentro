import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildWorkbookBuffer } from "@/lib/reports/excel"
import { contentDispositionAnexo, formatCpfCnpj, formatDate } from "@/lib/format"

export const runtime = "nodejs"
export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: funcionarios, error } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("contrato_id", id)
    .order("nome")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (funcionarios || []).map((f) => ({
    Nome: f.nome,
    Matrícula: f.matricula || "",
    CPF: formatCpfCnpj(f.cpf) || "",
    Cargo: f.funcao || "",
    Admissão: formatDate(f.data_admissao) || "",
    "Salário Base": f.salario_base,
    "VT Informado": f.vt_informado,
    "VR Informado": f.vr_informado,
    "Reembolso Creche": f.reembolso_creche ?? 0,
  }))

  const buffer = buildWorkbookBuffer([{ name: "Funcionários", rows }])
  const nomeArquivo = `Exportação - Funcionários.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDispositionAnexo(nomeArquivo),
    },
  })
}
