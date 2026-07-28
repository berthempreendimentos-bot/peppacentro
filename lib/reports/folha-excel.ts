import ExcelJS from "exceljs"

import { calcularEncargos, somarTotais, type FuncionarioBase } from "@/lib/calculo-folha"
import { formatCpfCnpj, formatDate } from "@/lib/format"

const COR_TITULO = "FF1A1B22"
const COR_FAIXA_TITULO = "FFFFD700"
const COR_SECAO = "FF1A1B22"
const COR_SECAO_TEXTO = "FFFFFFFF"
const COR_TOTAL = "FFF4F2FD"
const COR_DESTAQUE = "FFFFD700"
const COR_CABECALHO_TABELA = "FF1A1B22"
const COR_CABECALHO_TEXTO = "FFFFFFFF"
const COR_LINHA_PAR = "FFF7F6FB"
const COR_BORDA = "FFD0C6AB"

const FORMATO_MOEDA = '_-"R$" * #,##0.00_-;-"R$" * #,##0.00_-;_-"R$" * "-"??_-;_-@_-'

const bordaFina = {
  top: { style: "thin" as const, color: { argb: COR_BORDA } },
  left: { style: "thin" as const, color: { argb: COR_BORDA } },
  bottom: { style: "thin" as const, color: { argb: COR_BORDA } },
  right: { style: "thin" as const, color: { argb: COR_BORDA } },
}

type FuncionarioComId = FuncionarioBase & {
  nome: string
  cpf: string | null
  funcao: string | null
  data_admissao: string | null
}

function adicionarTitulo(
  sheet: ExcelJS.Worksheet,
  colunas: number,
  contratoTitulo: string,
  mesReferencia: string
) {
  sheet.mergeCells(1, 1, 1, colunas)
  const linhaTitulo = sheet.getRow(1)
  linhaTitulo.getCell(1).value = `Folha de Pagamento — ${contratoTitulo}`
  linhaTitulo.getCell(1).font = { bold: true, size: 14, color: { argb: COR_TITULO } }
  linhaTitulo.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COR_FAIXA_TITULO },
  }
  linhaTitulo.getCell(1).alignment = { vertical: "middle", horizontal: "left" }
  linhaTitulo.height = 24

  sheet.mergeCells(2, 1, 2, colunas)
  const linhaMes = sheet.getRow(2)
  linhaMes.getCell(1).value = `Referência: ${mesReferencia}`
  linhaMes.getCell(1).font = { italic: true, size: 10, color: { argb: "FF666666" } }
}

function linhaSecao(sheet: ExcelJS.Worksheet, texto: string, colunas: number) {
  const row = sheet.addRow([texto])
  sheet.mergeCells(row.number, 1, row.number, colunas)
  row.getCell(1).font = { bold: true, color: { argb: COR_SECAO_TEXTO } }
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_SECAO } }
  row.height = 18
  return row
}

function aplicarBordaLinha(row: ExcelJS.Row, colunas: number) {
  for (let i = 1; i <= colunas; i++) {
    row.getCell(i).border = bordaFina
  }
}

export function buildFolhaResumoSheet(
  workbook: ExcelJS.Workbook,
  {
    contratoTitulo,
    mesReferencia,
    funcionarios,
  }: { contratoTitulo: string; mesReferencia: string; funcionarios: FuncionarioComId[] }
) {
  const sheet = workbook.addWorksheet("Resumo")
  sheet.columns = [
    { width: 26 },
    { width: 16 },
    { width: 4 },
    { width: 26 },
    { width: 16 },
  ]

  adicionarTitulo(sheet, 5, contratoTitulo, mesReferencia)
  sheet.addRow([])

  const totais = somarTotais(funcionarios)

  const linhaCab = sheet.addRow(["DESCRIÇÃO", "PROVENTOS", "", "", "DESCONTOS"])
  ;[1, 2, 4, 5].forEach((col) => {
    linhaCab.getCell(col).font = { bold: true, color: { argb: COR_CABECALHO_TEXTO } }
    linhaCab.getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COR_CABECALHO_TABELA },
    }
  })

  const proventos: [string, number][] = [
    ["Salário Base", totais.salarioBase],
    ["VT Informado", totais.vtInformado],
    ["VR Informado", totais.vrInformado],
  ]
  const descontos: [string, number][] = [
    ["Desconto VT (6%)", totais.descVt],
    ["Desconto VA (10%)", totais.descVa],
    ["Desconto INSS Empregado", totais.inssEmpregadoValor],
  ]

  for (let i = 0; i < 3; i++) {
    const row = sheet.addRow([proventos[i][0], proventos[i][1], "", descontos[i][0], descontos[i][1]])
    row.getCell(2).numFmt = FORMATO_MOEDA
    row.getCell(5).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 5)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
      row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
    }
  }

  const totalProventos = totais.salarioBase + totais.vtInformado + totais.vrInformado
  const totalDescontos = totais.descVt + totais.descVa + totais.inssEmpregadoValor

  const rowTotais = sheet.addRow(["TOTAL", totalProventos, "", "TOTAL", totalDescontos])
  ;[1, 2, 4, 5].forEach((col) => {
    rowTotais.getCell(col).font = { bold: true }
    rowTotais.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  })
  rowTotais.getCell(2).numFmt = FORMATO_MOEDA
  rowTotais.getCell(5).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowTotais, 5)

  sheet.addRow([])
  const rowLiquido = sheet.addRow(["TOTAL LÍQUIDO DOS EMPREGADOS", totais.liquido])
  sheet.mergeCells(rowLiquido.number, 1, rowLiquido.number, 1)
  rowLiquido.getCell(1).font = { bold: true, size: 12 }
  rowLiquido.getCell(2).font = { bold: true, size: 12 }
  rowLiquido.getCell(2).numFmt = FORMATO_MOEDA
  rowLiquido.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
  rowLiquido.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }

  sheet.addRow([])
  sheet.addRow([])
  linhaSecao(sheet, "ENCARGOS PATRONAIS", 5)

  const encargos: [string, number][] = [
    ["FGTS (8%)", totais.fgts],
    ["INSS Patronal (20%)", totais.inssPatronal],
    ["RAT (3%)", totais.rat],
    ["Terceiros (5,8%)", totais.terceiros],
  ]
  encargos.forEach(([label, valor], i) => {
    const row = sheet.addRow([label, valor])
    row.getCell(2).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 2)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
    }
  })
  const rowTotalEncargos = sheet.addRow(["TOTAL ENCARGOS", totais.totalEncargos])
  rowTotalEncargos.getCell(1).font = { bold: true }
  rowTotalEncargos.getCell(2).font = { bold: true }
  rowTotalEncargos.getCell(2).numFmt = FORMATO_MOEDA
  rowTotalEncargos.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  rowTotalEncargos.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  aplicarBordaLinha(rowTotalEncargos, 2)

  sheet.addRow([])
  sheet.addRow([])
  linhaSecao(sheet, "TOTAL DESPESA: FOLHA + ENCARGOS", 5)

  const rowEncargos2 = sheet.addRow(["Encargos Patronais", totais.totalEncargos])
  rowEncargos2.getCell(2).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowEncargos2, 2)
  const rowEmpregados = sheet.addRow(["Líquido dos Empregados", totais.liquido])
  rowEmpregados.getCell(2).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowEmpregados, 2)
  rowEmpregados.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }

  sheet.addRow([])
  const rowTotalGasto = sheet.addRow(["TOTAL DE GASTOS", totais.custoEmpresa])
  rowTotalGasto.getCell(1).font = { bold: true, size: 13 }
  rowTotalGasto.getCell(2).font = { bold: true, size: 13 }
  rowTotalGasto.getCell(2).numFmt = FORMATO_MOEDA
  rowTotalGasto.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
  rowTotalGasto.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
  rowTotalGasto.height = 22

  return sheet
}

export function buildPorFuncaoSheet(
  workbook: ExcelJS.Workbook,
  {
    contratoTitulo,
    mesReferencia,
    funcionarios,
  }: { contratoTitulo: string; mesReferencia: string; funcionarios: FuncionarioComId[] }
) {
  const sheet = workbook.addWorksheet("Por Função")
  sheet.columns = [
    { width: 30 },
    { width: 10 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
  ]
  adicionarTitulo(sheet, 6, contratoTitulo, mesReferencia)
  sheet.addRow([])

  const porFuncao = new Map<
    string,
    { quantidade: number; salarioBase: number; liquido: number; totalEncargos: number; custoEmpresa: number }
  >()
  for (const funcionario of funcionarios) {
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
  const linhas = Array.from(porFuncao.entries())
    .map(([funcao, v]) => ({ funcao, ...v }))
    .sort((a, b) => b.custoEmpresa - a.custoEmpresa)

  const headerRow = sheet.addRow([
    "Função",
    "Qtd.",
    "Salário Base",
    "Líquido",
    "Encargos Patronais",
    "Custo Total",
  ])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COR_CABECALHO_TEXTO } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_CABECALHO_TABELA } }
  })
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }]

  linhas.forEach((linha, i) => {
    const row = sheet.addRow([
      linha.funcao,
      linha.quantidade,
      linha.salarioBase,
      linha.liquido,
      linha.totalEncargos,
      linha.custoEmpresa,
    ])
    row.getCell(3).numFmt = FORMATO_MOEDA
    row.getCell(4).numFmt = FORMATO_MOEDA
    row.getCell(5).numFmt = FORMATO_MOEDA
    row.getCell(6).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 6)
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
      })
    }
  })

  const totais = somarTotais(funcionarios)
  const rowTotal = sheet.addRow([
    "Total",
    totais.quantidade,
    totais.salarioBase,
    totais.liquido,
    totais.totalEncargos,
    totais.custoEmpresa,
  ])
  rowTotal.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  })
  rowTotal.getCell(3).numFmt = FORMATO_MOEDA
  rowTotal.getCell(4).numFmt = FORMATO_MOEDA
  rowTotal.getCell(5).numFmt = FORMATO_MOEDA
  rowTotal.getCell(6).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowTotal, 6)

  return sheet
}

export function buildFuncionariosSheet(
  workbook: ExcelJS.Workbook,
  {
    contratoTitulo,
    mesReferencia,
    funcionarios,
  }: { contratoTitulo: string; mesReferencia: string; funcionarios: FuncionarioComId[] }
) {
  const sheet = workbook.addWorksheet("Funcionários")
  const colunas = [
    { header: "Nome", width: 28 },
    { header: "CPF", width: 16 },
    { header: "Função", width: 20 },
    { header: "Admissão", width: 12 },
    { header: "Salário Base", width: 14 },
    { header: "VT Informado", width: 13 },
    { header: "VR Informado", width: 13 },
    { header: "Desc. VT (6%)", width: 13 },
    { header: "30% Periculosidade", width: 15 },
    { header: "INSS Empregado", width: 14 },
    { header: "Desc. VA (10%)", width: 13 },
    { header: "Líquido do Empregado", width: 16 },
    { header: "FGTS 8%", width: 12 },
    { header: "INSS Patronal 20%", width: 15 },
    { header: "RAT 3%", width: 11 },
    { header: "Terceiros 5,8%", width: 13 },
    { header: "Total Encargos", width: 14 },
    { header: "Custo Empresa", width: 14 },
  ]
  sheet.columns = colunas.map((c) => ({ width: c.width }))
  adicionarTitulo(sheet, colunas.length, contratoTitulo, mesReferencia)
  sheet.addRow([])

  const headerRow = sheet.addRow(colunas.map((c) => c.header))
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COR_CABECALHO_TEXTO } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_CABECALHO_TABELA } }
  })
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }]

  const colunasMoeda = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

  funcionarios.forEach((f, i) => {
    const e = calcularEncargos(f)
    const row = sheet.addRow([
      f.nome,
      formatCpfCnpj(f.cpf) || "",
      f.funcao ?? "",
      formatDate(f.data_admissao),
      f.salario_base,
      f.vt_informado,
      f.vr_informado,
      e.descVt,
      e.periculosidadeValor,
      e.inssEmpregadoValor,
      e.descVa,
      e.liquido,
      e.fgts,
      e.inssPatronal,
      e.rat,
      e.terceiros,
      e.totalEncargos,
      e.custoEmpresa,
    ])
    colunasMoeda.forEach((col) => {
      row.getCell(col).numFmt = FORMATO_MOEDA
    })
    aplicarBordaLinha(row, colunas.length)
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        if (!cell.fill) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
        }
      })
    }
  })

  return sheet
}

export async function buildFolhaPagamentoWorkbook(params: {
  contratoTitulo: string
  mesReferencia: string
  funcionarios: FuncionarioComId[]
}) {
  const workbook = new ExcelJS.Workbook()
  buildFolhaResumoSheet(workbook, params)
  buildPorFuncaoSheet(workbook, params)
  buildFuncionariosSheet(workbook, params)
  return workbook.xlsx.writeBuffer()
}
