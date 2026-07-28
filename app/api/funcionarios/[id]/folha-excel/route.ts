import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { buildWorkbookBuffer } from "@/lib/reports/excel"
import { calcularEncargos, somarTotais } from "@/lib/calculo-folha"
import { formatCpfCnpj, formatDate, formatMesAno } from "@/lib/format"

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

  const totais = somarTotais(funcionarios ?? [])

  const porFuncao = new Map<string, { quantidade: number; salarioBase: number; liquido: number; totalEncargos: number; custoEmpresa: number }>()
  for (const funcionario of funcionarios ?? []) {
    const chave = funcionario.funcao?.trim() || "Sem função"
    const encargos = calcularEncargos(funcionario)
    const atual = porFuncao.get(chave) ?? {
      quantidade: 0,
      salarioBase: 0,
      liquido: 0,
      totalEncargos: 0,
      custoEmpresa: 0,
    }
    porFuncao.set(chave, {
      quantidade: atual.quantidade + 1,
      salarioBase: atual.salarioBase + funcionario.salario_base,
      liquido: atual.liquido + encargos.liquido,
      totalEncargos: atual.totalEncargos + encargos.totalEncargos,
      custoEmpresa: atual.custoEmpresa + encargos.custoEmpresa,
    })
  }

  const resumoRows = [
    { Item: "Referência", Valor: formatMesAno() },
    { Item: "Funcionários", Valor: totais.quantidade },
    { Item: "Total Salário Base", Valor: totais.salarioBase },
    { Item: "Total Líquido", Valor: totais.liquido },
    { Item: "Total Encargos Patronais", Valor: totais.totalEncargos },
    { Item: "Custo Total da Folha", Valor: totais.custoEmpresa },
  ]

  const porFuncaoRows = Array.from(porFuncao.entries())
    .map(([funcao, v]) => ({
      Função: funcao,
      Quantidade: v.quantidade,
      "Salário Base": v.salarioBase,
      Líquido: v.liquido,
      "Encargos Patronais": v.totalEncargos,
      "Custo Total": v.custoEmpresa,
    }))
    .sort((a, b) => b["Custo Total"] - a["Custo Total"])

  const funcionariosRows = (funcionarios ?? []).map((f) => {
    const e = calcularEncargos(f)
    return {
      Nome: f.nome,
      CPF: formatCpfCnpj(f.cpf) || "",
      Função: f.funcao ?? "",
      Admissão: formatDate(f.data_admissao),
      "Salário Base": f.salario_base,
      "VT Informado": f.vt_informado,
      "VR Informado": f.vr_informado,
      "Desc. VT (6%)": e.descVt,
      "30% Periculosidade": e.periculosidadeValor,
      "INSS Empregado": e.inssEmpregadoValor,
      "Desc. VA (10%)": e.descVa,
      "Líquido do Empregado": e.liquido,
      "FGTS 8%": e.fgts,
      "INSS Patronal 20%": e.inssPatronal,
      "RAT 3%": e.rat,
      "Terceiros 5,8%": e.terceiros,
      "Total Encargos": e.totalEncargos,
      "Custo Empresa": e.custoEmpresa,
    }
  })

  const buffer = buildWorkbookBuffer([
    { name: "Resumo", rows: resumoRows },
    { name: "Por Função", rows: porFuncaoRows },
    { name: "Funcionários", rows: funcionariosRows },
  ])

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="folha-de-pagamento.xlsx"',
    },
  })
}
