import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"

import { createClient } from "@/lib/supabase/server"
import { FolhaPagamentoPdfDocument } from "@/lib/reports/pdf"
import { calcularEncargos, somarTotais } from "@/lib/calculo-folha"
import { formatMesAno } from "@/lib/format"

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

  const lista = funcionarios ?? []
  const totais = somarTotais(lista)

  const porFuncaoMap = new Map<string, { quantidade: number; salarioBase: number; liquido: number; totalEncargos: number; custoEmpresa: number }>()
  for (const funcionario of lista) {
    const chave = funcionario.funcao?.trim() || "Sem função"
    const encargos = calcularEncargos(funcionario)
    const atual = porFuncaoMap.get(chave) ?? {
      quantidade: 0,
      salarioBase: 0,
      liquido: 0,
      totalEncargos: 0,
      custoEmpresa: 0,
    }
    porFuncaoMap.set(chave, {
      quantidade: atual.quantidade + 1,
      salarioBase: atual.salarioBase + funcionario.salario_base,
      liquido: atual.liquido + encargos.liquido,
      totalEncargos: atual.totalEncargos + encargos.totalEncargos,
      custoEmpresa: atual.custoEmpresa + encargos.custoEmpresa,
    })
  }
  const porFuncao = Array.from(porFuncaoMap.entries())
    .map(([funcao, v]) => ({ funcao, ...v }))
    .sort((a, b) => b.custoEmpresa - a.custoEmpresa)

  const funcionariosRows = lista.map((f) => {
    const e = calcularEncargos(f)
    return {
      nome: f.nome,
      funcao: f.funcao ?? "—",
      salarioBase: f.salario_base,
      liquido: e.liquido,
      totalEncargos: e.totalEncargos,
      custoEmpresa: e.custoEmpresa,
    }
  })

  const buffer = await renderToBuffer(
    <FolhaPagamentoPdfDocument
      mesReferencia={formatMesAno()}
      funcionarios={funcionariosRows}
      porFuncao={porFuncao}
      totais={totais}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="folha-de-pagamento.pdf"',
    },
  })
}
