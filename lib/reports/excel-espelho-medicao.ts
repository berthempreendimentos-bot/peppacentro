import ExcelJS from "exceljs"

import { TAXA_COFINS, TAXA_CSLL, TAXA_IRRF, TAXA_IRRF_SEM_MATERIAL, TAXA_PIS, TAXA_RETENCAO_INSS } from "@/lib/calculo-medicao"
import { formatCpfCnpj, formatDate } from "@/lib/format"
import { valorPorExtenso } from "@/lib/numero-por-extenso"

const COR_TITULO = "FF1A1B22"
const COR_FAIXA_TITULO = "FFFFD700"
const COR_SECAO = "FF1A1B22"
const COR_SECAO_TEXTO = "FFFFFFFF"
const COR_TOTAL = "FFF4F2FD"
const COR_DESTAQUE = "FFFFD700"
const COR_CABECALHO_TABELA = "FF1A1B22"
const COR_CABECALHO_TEXTO = "FFFFFFFF"
const COR_BORDA = "FFD0C6AB"

const FORMATO_MOEDA = '_-"R$" * #,##0.00_-;-"R$" * #,##0.00_-;_-"R$" * "-"??_-;_-@_-'

const bordaFina = {
  top: { style: "thin" as const, color: { argb: COR_BORDA } },
  left: { style: "thin" as const, color: { argb: COR_BORDA } },
  bottom: { style: "thin" as const, color: { argb: COR_BORDA } },
  right: { style: "thin" as const, color: { argb: COR_BORDA } },
}

function aplicarBordaLinha(row: ExcelJS.Row, colunas: number) {
  for (let i = 1; i <= colunas; i++) {
    row.getCell(i).border = bordaFina
  }
}

function linhaSecao(sheet: ExcelJS.Worksheet, texto: string, colunas: number) {
  const row = sheet.addRow([texto])
  sheet.mergeCells(row.number, 1, row.number, colunas)
  row.getCell(1).font = { bold: true, color: { argb: COR_SECAO_TEXTO } }
  row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_SECAO } }
  row.height = 18
  return row
}

function formula(cell: ExcelJS.Cell, expressao: string, resultado: number) {
  cell.value = { formula: expressao, result: resultado }
}

export async function buildEspelhoMedicaoWorkbook({
  clienteNome,
  clienteEndereco,
  clientePracaPagamento,
  clienteCpfCnpj,
  contratoNumero,
  objetoContrato,
  dataInicioContrato,
  periodoInicio,
  periodoFim,
  numeroMedicao,
  valorContrato,
  maoDeObra,
  valeTransporte,
  valeRefeicao,
  material,
  issAliquota,
}: {
  clienteNome: string
  clienteEndereco: string | null
  clientePracaPagamento: string | null
  clienteCpfCnpj: string | null
  contratoNumero: string
  objetoContrato: string
  dataInicioContrato: string | null
  periodoInicio: string
  periodoFim: string
  numeroMedicao: number
  valorContrato: number
  maoDeObra: number
  valeTransporte: number
  valeRefeicao: number
  material: number
  issAliquota: number
}) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Espelho de Medição")
  sheet.columns = [{ width: 24 }, { width: 16 }, { width: 60 }, { width: 20 }, { width: 20 }]

  const rowTitulo = sheet.addRow([clienteNome])
  sheet.mergeCells(rowTitulo.number, 1, rowTitulo.number, 5)
  rowTitulo.getCell(1).font = { bold: true, size: 14, color: { argb: COR_TITULO } }
  rowTitulo.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_FAIXA_TITULO } }
  rowTitulo.getCell(1).alignment = { vertical: "middle", horizontal: "left" }
  rowTitulo.height = 24

  const rowSubtitulo = sheet.addRow([`Espelho de Medição nº ${numeroMedicao}`])
  sheet.mergeCells(rowSubtitulo.number, 1, rowSubtitulo.number, 5)
  rowSubtitulo.getCell(1).font = { italic: true, size: 10, color: { argb: "FF666666" } }

  sheet.addRow([])
  linhaSecao(sheet, "DESTINATÁRIO", 5)

  const destinatario: [string, string][] = [
    ["Nome da Firma", clienteNome],
    ["Endereço", clienteEndereco || "—"],
    ["Praça de Pagamento", clientePracaPagamento || "—"],
    ["CNPJ/CPF", formatCpfCnpj(clienteCpfCnpj) || "—"],
    ["Início", formatDate(dataInicioContrato)],
  ]
  destinatario.forEach(([label, valor]) => {
    const row = sheet.addRow([label, valor])
    row.getCell(1).font = { bold: true }
    sheet.mergeCells(row.number, 2, row.number, 5)
    aplicarBordaLinha(row, 5)
  })

  sheet.addRow([])
  const rowExtensoLabel = sheet.addRow(["VALOR POR EXTENSO"])
  rowExtensoLabel.getCell(1).font = { bold: true }
  const rowExtenso = sheet.addRow([])
  sheet.mergeCells(rowExtenso.number, 1, rowExtenso.number, 5)
  rowExtenso.getCell(1).alignment = { wrapText: true }
  rowExtenso.height = 30
  aplicarBordaLinha(rowExtenso, 5)

  sheet.addRow([])
  const headerTabela = sheet.addRow(["Unidade", "Quantidade", "Posto Administração", "Preço Unitário", "Valor"])
  headerTabela.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COR_CABECALHO_TEXTO } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_CABECALHO_TABELA } }
  })

  const objetoCompleto =
    `OBJETO: ${objetoContrato} Conforme Contrato nº ${contratoNumero}, referente ao período de ${periodoInicio} a ${periodoFim}. ` +
    `Alimentação (Vale Refeição) e Vale Transporte discriminados abaixo. Base de cálculo para retenção do INSS: Mão de Obra × 11%.`

  const rowObjeto = sheet.addRow(["UND", 1, objetoCompleto, 0, 0])
  rowObjeto.getCell(1).alignment = { vertical: "top", horizontal: "center" }
  rowObjeto.getCell(2).alignment = { vertical: "top", horizontal: "center" }
  rowObjeto.getCell(3).alignment = { wrapText: true, vertical: "top" }
  rowObjeto.getCell(4).alignment = { vertical: "top" }
  rowObjeto.getCell(5).alignment = { vertical: "top" }
  rowObjeto.height = 135
  aplicarBordaLinha(rowObjeto, 5)

  sheet.addRow([])

  function linhaDestaque(label: string, valor: number) {
    const row = sheet.addRow([label, "", "", valor, ""])
    sheet.mergeCells(row.number, 1, row.number, 3)
    sheet.mergeCells(row.number, 4, row.number, 5)
    row.getCell(1).font = { bold: true, size: 11 }
    row.getCell(4).font = { bold: true, size: 11 }
    row.getCell(4).numFmt = FORMATO_MOEDA
    row.getCell(4).alignment = { horizontal: "right" }
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
    row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_DESTAQUE } }
    row.height = 20
    aplicarBordaLinha(row, 5)
    return row
  }

  linhaDestaque("VALOR DO CONTRATO", valorContrato)

  sheet.addRow([])
  linhaSecao(sheet, "COMPOSIÇÃO DO VALOR A FATURAR", 5)

  const rowMaoDeObra = sheet.addRow(["MÃO DE OBRA", maoDeObra])
  const rowVt = sheet.addRow(["VALE TRANSPORTE", valeTransporte])
  const rowVr = sheet.addRow(["VALE REFEIÇÃO", valeRefeicao])
  const rowMaterial = sheet.addRow(["MATERIAL", material])
  ;[rowMaoDeObra, rowVt, rowVr, rowMaterial].forEach((row, i) => {
    row.getCell(2).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 2)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F6FB" } }
    }
  })

  const valorAFaturar = maoDeObra + valeTransporte + valeRefeicao + material
  const rowValorAFaturar = linhaDestaque("VALOR A FATURAR", valorAFaturar)
  formula(
    rowValorAFaturar.getCell(4),
    `SUM(B${rowMaoDeObra.number}:B${rowMaterial.number})`,
    valorAFaturar
  )

  // Preenche a fórmula do preço/valor da linha do objeto, agora que a
  // linha de Valor a Faturar já existe.
  formula(rowObjeto.getCell(4), `D${rowValorAFaturar.number}`, valorAFaturar)
  formula(rowObjeto.getCell(5), `D${rowValorAFaturar.number}`, valorAFaturar)
  rowObjeto.getCell(4).numFmt = FORMATO_MOEDA
  rowObjeto.getCell(5).numFmt = FORMATO_MOEDA

  sheet.addRow([])
  linhaSecao(sheet, "RETENÇÕES", 5)

  const baseRetencaoRef = `B${rowMaoDeObra.number}`
  const retencaoInss = maoDeObra * TAXA_RETENCAO_INSS
  const taxaIrrfAplicada = material > 0 ? TAXA_IRRF : TAXA_IRRF_SEM_MATERIAL
  const irrf = maoDeObra * taxaIrrfAplicada
  const pis = maoDeObra * TAXA_PIS
  const cofins = maoDeObra * TAXA_COFINS
  const csll = maoDeObra * TAXA_CSLL
  const iss = maoDeObra * (issAliquota / 100)

  const rowInss = sheet.addRow(["RETENÇÃO INSS (11%)", retencaoInss])
  formula(rowInss.getCell(2), `${baseRetencaoRef}*${TAXA_RETENCAO_INSS}`, retencaoInss)
  const rowIrrf = sheet.addRow([`IRRF (${(taxaIrrfAplicada * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%)`, irrf])
  formula(rowIrrf.getCell(2), `${baseRetencaoRef}*${taxaIrrfAplicada}`, irrf)
  const rowPis = sheet.addRow(["PIS (0,65%)", pis])
  formula(rowPis.getCell(2), `${baseRetencaoRef}*${TAXA_PIS}`, pis)
  const rowCofins = sheet.addRow(["COFINS (3%)", cofins])
  formula(rowCofins.getCell(2), `${baseRetencaoRef}*${TAXA_COFINS}`, cofins)
  const rowCsll = sheet.addRow(["CSLL (1,00%)", csll])
  formula(rowCsll.getCell(2), `${baseRetencaoRef}*${TAXA_CSLL}`, csll)
  const rowIss = sheet.addRow([`VALOR DO ISS (${issAliquota}%)`, iss])
  formula(rowIss.getCell(2), `${baseRetencaoRef}*${issAliquota / 100}`, iss)

  const linhasRetencao = [rowInss, rowIrrf, rowPis, rowCofins, rowCsll, rowIss]
  linhasRetencao.forEach((row, i) => {
    row.getCell(2).numFmt = FORMATO_MOEDA
    aplicarBordaLinha(row, 2)
    if (i % 2 === 1) {
      row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F6FB" } }
    }
  })

  const retencaoTotal = retencaoInss + irrf + pis + cofins + csll + iss
  const valorLiquido = valorAFaturar - retencaoTotal

  sheet.addRow([])
  linhaSecao(sheet, "RESUMO FINAL", 5)

  const rowValorServicos = sheet.addRow(["VALOR DOS SERVIÇOS", valorAFaturar])
  formula(rowValorServicos.getCell(2), `D${rowValorAFaturar.number}`, valorAFaturar)
  rowValorServicos.getCell(2).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowValorServicos, 2)

  const rowRetencaoTotal = sheet.addRow(["RETENÇÃO", retencaoTotal])
  formula(
    rowRetencaoTotal.getCell(2),
    `SUM(B${rowInss.number}:B${rowIss.number})`,
    retencaoTotal
  )
  rowRetencaoTotal.getCell(2).numFmt = FORMATO_MOEDA
  aplicarBordaLinha(rowRetencaoTotal, 2)

  const rowValorTotal = sheet.addRow(["VALOR TOTAL", valorLiquido])
  rowValorTotal.getCell(1).font = { bold: true, size: 13 }
  rowValorTotal.getCell(2).font = { bold: true, size: 13 }
  formula(
    rowValorTotal.getCell(2),
    `B${rowValorServicos.number}-B${rowRetencaoTotal.number}`,
    valorLiquido
  )
  rowValorTotal.getCell(2).numFmt = FORMATO_MOEDA
  rowValorTotal.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  rowValorTotal.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_TOTAL } }
  aplicarBordaLinha(rowValorTotal, 2)

  // Preenche o texto por extenso agora que o Valor a Faturar é conhecido.
  rowExtenso.getCell(1).value = valorPorExtenso(valorAFaturar)

  return workbook.xlsx.writeBuffer()
}
