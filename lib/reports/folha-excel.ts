import ExcelJS from "exceljs"

import {
  calcularContaDepositoVinculada,
  calcularEncargos,
  somarTotais,
  TAXA_DECIMO_TERCEIRO,
  TAXA_DESC_VA,
  TAXA_DESC_VT,
  TAXA_FERIAS_ADICIONAL,
  TAXA_FGTS,
  TAXA_INCIDENCIA_SUBMODULO_22,
  TAXA_INSS_PATRONAL,
  TAXA_MULTA_FGTS,
  TAXA_RAT,
  TAXA_TERCEIROS,
  type FuncionarioBase,
  type TaxasTributos,
} from "@/lib/calculo-folha"
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

function formatarPercentual(fracao: number): string {
  return `${(fracao * 100).toFixed(1).replace(".0", "")}%`
}

function resolverTaxas(taxas?: TaxasTributos): TaxasTributos {
  return taxas ?? { fgts: TAXA_FGTS, inssPatronal: TAXA_INSS_PATRONAL, rat: TAXA_RAT, terceiros: TAXA_TERCEIROS }
}

function formula(cell: ExcelJS.Cell, expressao: string, resultado: number) {
  cell.value = { formula: expressao, result: resultado }
}

export function buildFolhaResumoSheet(
  workbook: ExcelJS.Workbook,
  {
    contratoTitulo,
    mesReferencia,
    funcionarios,
    taxas,
  }: {
    contratoTitulo: string
    mesReferencia: string
    funcionarios: FuncionarioComId[]
    taxas?: TaxasTributos
  }
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

  const taxasEfetivas = resolverTaxas(taxas)
  const totais = somarTotais(funcionarios, taxas)

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
    ["Reembolsos", totais.reembolso ?? 0],
    ["Reembolso - Creche", totais.reembolso_creche ?? 0],
    ["VT Informado", totais.vtInformado],
    ["VR Informado", totais.vrInformado],
  ]
  const descontos: [string, number][] = [
    ["Faltas", totais.faltas ?? 0],
    ["Desconto VT (6%)", totais.descVt],
    ["Desconto VA (10%)", totais.descVa],
    ["Desconto INSS Empregado", totais.inssEmpregadoValor],
  ]

  // Linhas 5, 6 e 7 — valores de origem (não são fórmulas: vêm da soma dos
  // funcionários, calculada em lib/calculo-folha.ts).
  const linhaProventosInicio = linhaCab.number + 1
  for (let i = 0; i < 5; i++) {
    const row = sheet.addRow([proventos[i][0], proventos[i][1], "", descontos[i] ? descontos[i][0] : "", descontos[i] ? descontos[i][1] : ""])
    row.getCell(2).numFmt = FORMATO_MOEDA
    row.getCell(5).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 5)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
      row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
    }
  }
  const linhaProventosFim = linhaProventosInicio + 4

  const totalProventos = totais.salarioBase + (totais.reembolso ?? 0) + (totais.reembolso_creche ?? 0) + totais.vtInformado + totais.vrInformado
  const totalDescontos = (totais.faltas ?? 0) + totais.descVt + totais.descVa + totais.inssEmpregadoValor

  const rowTotais = sheet.addRow(["TOTAL", totalProventos, "", "TOTAL", totalDescontos])
  ;[1, 2, 4, 5].forEach((col) => {
    rowTotais.getCell(col).font = { bold: true }
    rowTotais.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  })
  formula(rowTotais.getCell(2), `SUM(B${linhaProventosInicio}:B${linhaProventosFim})`, totalProventos)
  formula(rowTotais.getCell(5), `SUM(E${linhaProventosInicio}:E${linhaProventosFim})`, totalDescontos)
  rowTotais.getCell(2).numFmt = FORMATO_MOEDA
  rowTotais.getCell(5).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowTotais, 5)

  sheet.addRow([])
  const rowLiquido = sheet.addRow(["TOTAL LÍQUIDO DOS EMPREGADOS", totais.liquido])
  sheet.mergeCells(rowLiquido.number, 1, rowLiquido.number, 1)
  rowLiquido.getCell(1).font = { bold: true, size: 12 }
  rowLiquido.getCell(2).font = { bold: true, size: 12 }
  formula(rowLiquido.getCell(2), `B${rowTotais.number}-E${rowTotais.number}`, totais.liquido)
  rowLiquido.getCell(2).numFmt = FORMATO_MOEDA
  rowLiquido.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
  rowLiquido.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }

  sheet.addRow([])
  sheet.addRow([])
  linhaSecao(sheet, "ENCARGOS PATRONAIS", 5)

  const encargos: [string, number][] = [
    [`FGTS (${formatarPercentual(taxasEfetivas.fgts)})`, totais.fgts],
    [`INSS Patronal (${formatarPercentual(taxasEfetivas.inssPatronal)})`, totais.inssPatronal],
    [`RAT (${formatarPercentual(taxasEfetivas.rat)})`, totais.rat],
    [`Terceiros (${formatarPercentual(taxasEfetivas.terceiros)})`, totais.terceiros],
  ]
  let linhaEncargosInicio = 0
  encargos.forEach(([label, valor], i) => {
    const row = sheet.addRow([label, valor])
    if (i === 0) linhaEncargosInicio = row.number
    row.getCell(2).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 2)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
    }
  })
  const linhaEncargosFim = linhaEncargosInicio + encargos.length - 1

  const rowTotalEncargos = sheet.addRow(["TOTAL ENCARGOS", totais.totalEncargos])
  rowTotalEncargos.getCell(1).font = { bold: true }
  rowTotalEncargos.getCell(2).font = { bold: true }
  formula(
    rowTotalEncargos.getCell(2),
    `SUM(B${linhaEncargosInicio}:B${linhaEncargosFim})`,
    totais.totalEncargos
  )
  rowTotalEncargos.getCell(2).numFmt = FORMATO_MOEDA
  rowTotalEncargos.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  rowTotalEncargos.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  aplicarBordaLinha(rowTotalEncargos, 2)

  sheet.addRow([])
  sheet.addRow([])
  linhaSecao(sheet, "TOTAL DESPESA: FOLHA + FGTS", 5)

  const rowEncargos2 = sheet.addRow([`FGTS (${formatarPercentual(taxasEfetivas.fgts)})`, totais.fgts])
  formula(rowEncargos2.getCell(2), `B${linhaEncargosInicio}`, totais.fgts)
  rowEncargos2.getCell(2).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowEncargos2, 2)
  const rowEmpregados = sheet.addRow(["Líquido dos Empregados", totais.liquido])
  formula(rowEmpregados.getCell(2), `B${rowLiquido.number}`, totais.liquido)
  rowEmpregados.getCell(2).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowEmpregados, 2)
  rowEmpregados.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }

  const totalGastoFolhaFgts = totais.fgts + totais.liquido

  sheet.addRow([])
  const rowTotalGasto = sheet.addRow(["TOTAL DE GASTOS", totalGastoFolhaFgts])
  rowTotalGasto.getCell(1).font = { bold: true, size: 13 }
  rowTotalGasto.getCell(2).font = { bold: true, size: 13 }
  formula(
    rowTotalGasto.getCell(2),
    `SUM(B${rowEncargos2.number}:B${rowEmpregados.number})`,
    totalGastoFolhaFgts
  )
  rowTotalGasto.getCell(2).numFmt = FORMATO_MOEDA
  rowTotalGasto.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
  rowTotalGasto.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
  rowTotalGasto.height = 22

  sheet.addRow([])
  sheet.addRow([])
  linhaSecao(sheet, "CONTA-DEPÓSITO VINCULADA", 5)

  const conta = calcularContaDepositoVinculada(totais.remuneracaoTotal)
  const contaLinhas: [string, number][] = [
    ["13º Salário (8,33%)", conta.decimoTerceiro],
    ["Férias e Adicional de Férias (12,10%)", conta.feriasAdicional],
    ["Incidência do submódulo 2.2 (7,82%)", conta.incidenciaSubmodulo22],
    ["Multa do FGTS (4,00%)", conta.multaFgts],
  ]
  let linhaContaInicio = 0
  contaLinhas.forEach(([label, valor], i) => {
    const row = sheet.addRow([label, valor])
    if (i === 0) linhaContaInicio = row.number
    row.getCell(2).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 2)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
    }
  })
  const linhaContaFim = linhaContaInicio + contaLinhas.length - 1

  const rowTotalRetencao = sheet.addRow([
    "TOTAL DE RETENÇÃO MENSAL (32,25%)",
    conta.totalRetencaoMensal,
  ])
  rowTotalRetencao.getCell(1).font = { bold: true }
  rowTotalRetencao.getCell(2).font = { bold: true }
  formula(
    rowTotalRetencao.getCell(2),
    `SUM(B${linhaContaInicio}:B${linhaContaFim})`,
    conta.totalRetencaoMensal
  )
  rowTotalRetencao.getCell(2).numFmt = FORMATO_MOEDA
  rowTotalRetencao.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  rowTotalRetencao.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  aplicarBordaLinha(rowTotalRetencao, 2)

  return sheet
}

export function buildPorFuncaoSheet(
  workbook: ExcelJS.Workbook,
  {
    contratoTitulo,
    mesReferencia,
    funcionarios,
    taxas,
  }: {
    contratoTitulo: string
    mesReferencia: string
    funcionarios: FuncionarioComId[]
    taxas?: TaxasTributos
  }
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
    const encargos = calcularEncargos(funcionario, taxas)
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

  const totais = somarTotais(funcionarios, taxas)
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

  if (linhas.length > 0) {
    const primeiraLinha = headerRow.number + 1
    const ultimaLinha = headerRow.number + linhas.length
    formula(rowTotal.getCell(2), `SUM(B${primeiraLinha}:B${ultimaLinha})`, totais.quantidade)
    formula(rowTotal.getCell(3), `SUM(C${primeiraLinha}:C${ultimaLinha})`, totais.salarioBase)
    formula(rowTotal.getCell(4), `SUM(D${primeiraLinha}:D${ultimaLinha})`, totais.liquido)
    formula(rowTotal.getCell(5), `SUM(E${primeiraLinha}:E${ultimaLinha})`, totais.totalEncargos)
    formula(rowTotal.getCell(6), `SUM(F${primeiraLinha}:F${ultimaLinha})`, totais.custoEmpresa)
  }

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
    taxas,
  }: {
    contratoTitulo: string
    mesReferencia: string
    funcionarios: FuncionarioComId[]
    taxas?: TaxasTributos
  }
) {
  const sheet = workbook.addWorksheet("Funcionários")
  const taxasEfetivas = resolverTaxas(taxas)
  const colunas = [
    { header: "Nome", width: 28 },
    { header: "CPF", width: 16 },
    { header: "Função", width: 20 },
    { header: "Admissão", width: 12 },
    { header: "Salário Base", width: 14 },
    { header: "Faltas (R$)", width: 14 },
    { header: "Reembolso (R$)", width: 14 },
    { header: "Reembolso - Creche (R$)", width: 18 },
    { header: "VT Informado", width: 13 },
    { header: "VR Informado", width: 13 },
    { header: "Desc. VT (6%)", width: 13 },
    { header: "30% Periculosidade", width: 15 },
    { header: "INSS Empregado", width: 14 },
    { header: "Desc. VA (10%)", width: 13 },
    { header: "Líquido do Empregado", width: 16 },
    { header: `FGTS ${formatarPercentual(taxasEfetivas.fgts)}`, width: 12 },
    { header: `INSS Patronal ${formatarPercentual(taxasEfetivas.inssPatronal)}`, width: 15 },
    { header: `RAT ${formatarPercentual(taxasEfetivas.rat)}`, width: 11 },
    { header: `Terceiros ${formatarPercentual(taxasEfetivas.terceiros)}`, width: 13 },
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

  const colunasMoeda = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

  // Colunas cuja fórmula referencia apenas células da própria linha (E =
  // Salário Base, I = Periculosidade, F = VT, G = VR, H = Desc. VT,
  // J = INSS Empregado, K = Desc. VA, M-P = FGTS/INSS Patronal/RAT/Terceiros).
  // INSS Empregado (progressivo por faixas) e Periculosidade (depende de um
  // campo booleano que não aparece nesta planilha) continuam como valor
  // calculado, não fórmula.
  funcionarios.forEach((f, i) => {
    const e = calcularEncargos(f, taxas)
    const row = sheet.addRow([
      f.nome,
      formatCpfCnpj(f.cpf) || "",
      f.funcao ?? "",
      formatDate(f.data_admissao),
      f.salario_base,
      f.faltas ?? 0,
      f.reembolso ?? 0,
      f.reembolso_creche ?? 0,
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

    const r = row.number
    const baseStr = `MAX(0,E${r}-F${r})`
    formula(row.getCell(11), `IF(I${r}>0,${baseStr}*${TAXA_DESC_VT},0)`, e.descVt)
    formula(row.getCell(14), `J${r}*${TAXA_DESC_VA}`, e.descVa)
    formula(row.getCell(15), `${baseStr}-K${r}-M${r}-N${r}+G${r}+H${r}`, e.liquido)
    formula(row.getCell(16), `(${baseStr}+L${r})*${taxasEfetivas.fgts}`, e.fgts)
    formula(row.getCell(17), `(${baseStr}+L${r})*${taxasEfetivas.inssPatronal}`, e.inssPatronal)
    formula(row.getCell(18), `(${baseStr}+L${r})*${taxasEfetivas.rat}`, e.rat)
    formula(row.getCell(19), `(${baseStr}+L${r})*${taxasEfetivas.terceiros}`, e.terceiros)
    formula(row.getCell(20), `P${r}+Q${r}+R${r}+S${r}`, e.totalEncargos)
    formula(row.getCell(21), `${baseStr}+I${r}+J${r}+T${r}+G${r}+H${r}`, e.custoEmpresa)

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

export function buildContaDepositoVinculadaSheet(
  workbook: ExcelJS.Workbook,
  {
    contratoTitulo,
    mesReferencia,
    funcionarios,
    taxas,
  }: {
    contratoTitulo: string
    mesReferencia: string
    funcionarios: FuncionarioComId[]
    taxas?: TaxasTributos
  }
) {
  const sheet = workbook.addWorksheet("Conta-Depósito Vinculada")
  const colunas = [
    { header: "Nome", width: 28 },
    { header: "Remuneração Total", width: 16 },
    { header: "13º Salário (8,33%)", width: 15 },
    { header: "Férias e Adicional de Férias (12,10%)", width: 20 },
    {
      header: "Incidência do submódulo 2.2 sobre férias, adicional de férias e 13º salário (7,82%)",
      width: 22,
    },
    { header: "Multa do FGTS incidente sobre a remuneração, férias, 1/3 e 13º salário (4,00%)", width: 20 },
    { header: "Reembolso Creche", width: 16 },
    { header: "Total de Retenção Mensal", width: 18 },
  ]
  sheet.columns = colunas.map((c) => ({ width: c.width }))
  adicionarTitulo(sheet, colunas.length, contratoTitulo, mesReferencia)
  sheet.addRow([])

  const headerRow = sheet.addRow(colunas.map((c) => c.header))
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COR_CABECALHO_TEXTO } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_CABECALHO_TABELA } }
    cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" }
  })
  headerRow.height = 45
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }]

  const colunasMoeda = [2, 3, 4, 5, 6, 7, 8]
  let totalRemuneracao = 0
  let totalDecimoTerceiro = 0
  let totalFeriasAdicional = 0
  let totalIncidencia = 0
  let totalMulta = 0
  let totalReembolsoCreche = 0
  let totalRetencaoMensal = 0

  funcionarios.forEach((f, i) => {
    const encargos = calcularEncargos(f, taxas)
    const conta = calcularContaDepositoVinculada(encargos.remuneracaoTotal)
    const reembolsoCreche = f.reembolso_creche ?? 0
    const totalComReembolso = conta.totalRetencaoMensal + reembolsoCreche

    totalRemuneracao += encargos.remuneracaoTotal
    totalDecimoTerceiro += conta.decimoTerceiro
    totalFeriasAdicional += conta.feriasAdicional
    totalIncidencia += conta.incidenciaSubmodulo22
    totalMulta += conta.multaFgts
    totalReembolsoCreche += reembolsoCreche
    totalRetencaoMensal += totalComReembolso

    const row = sheet.addRow([
      f.nome,
      encargos.remuneracaoTotal,
      conta.decimoTerceiro,
      conta.feriasAdicional,
      conta.incidenciaSubmodulo22,
      conta.multaFgts,
      reembolsoCreche,
      totalComReembolso,
    ])

    const r = row.number
    formula(row.getCell(3), `B${r}*${TAXA_DECIMO_TERCEIRO}`, conta.decimoTerceiro)
    formula(row.getCell(4), `B${r}*${TAXA_FERIAS_ADICIONAL}`, conta.feriasAdicional)
    formula(row.getCell(5), `B${r}*${TAXA_INCIDENCIA_SUBMODULO_22}`, conta.incidenciaSubmodulo22)
    formula(row.getCell(6), `B${r}*${TAXA_MULTA_FGTS}`, conta.multaFgts)
    formula(row.getCell(8), `SUM(C${r}:G${r})`, totalComReembolso)

    colunasMoeda.forEach((col) => {
      row.getCell(col).numFmt = FORMATO_MOEDA
    })
    aplicarBordaLinha(row, colunas.length)
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_LINHA_PAR } }
      })
    }
  })

  const rowTotal = sheet.addRow([
    "Total",
    totalRemuneracao,
    totalDecimoTerceiro,
    totalFeriasAdicional,
    totalIncidencia,
    totalMulta,
    totalReembolsoCreche,
    totalRetencaoMensal,
  ])
  rowTotal.eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  })

  if (funcionarios.length > 0) {
    const primeiraLinha = headerRow.number + 1
    const ultimaLinha = headerRow.number + funcionarios.length
    formula(rowTotal.getCell(2), `SUM(B${primeiraLinha}:B${ultimaLinha})`, totalRemuneracao)
    formula(rowTotal.getCell(3), `SUM(C${primeiraLinha}:C${ultimaLinha})`, totalDecimoTerceiro)
    formula(rowTotal.getCell(4), `SUM(D${primeiraLinha}:D${ultimaLinha})`, totalFeriasAdicional)
    formula(rowTotal.getCell(5), `SUM(E${primeiraLinha}:E${ultimaLinha})`, totalIncidencia)
    formula(rowTotal.getCell(6), `SUM(F${primeiraLinha}:F${ultimaLinha})`, totalMulta)
    formula(rowTotal.getCell(7), `SUM(G${primeiraLinha}:G${ultimaLinha})`, totalReembolsoCreche)
    formula(rowTotal.getCell(8), `SUM(H${primeiraLinha}:H${ultimaLinha})`, totalRetencaoMensal)
  }

  colunasMoeda.forEach((col) => {
    rowTotal.getCell(col).numFmt = FORMATO_MOEDA
  })
  aplicarBordaLinha(rowTotal, colunas.length)

  return sheet
}

export async function buildFolhaPagamentoWorkbook(params: {
  contratoTitulo: string
  mesReferencia: string
  funcionarios: FuncionarioComId[]
  taxas?: TaxasTributos
}) {
  const workbook = new ExcelJS.Workbook()
  buildFolhaResumoSheet(workbook, params)
  buildPorFuncaoSheet(workbook, params)
  buildFuncionariosSheet(workbook, params)
  buildContaDepositoVinculadaSheet(workbook, params)
  return workbook.xlsx.writeBuffer()
}
