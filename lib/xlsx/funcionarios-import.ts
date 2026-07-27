import * as XLSX from "xlsx"

export type FuncionarioImportado = {
  linha: number
  nome: string
  cpf: string
  funcao: string
  dataAdmissao: string
  salarioBase: number
  incluir: boolean
}

const ALIASES: Record<"nome" | "cpf" | "funcao" | "dataAdmissao" | "salarioBase", string[]> = {
  nome: ["nome"],
  cpf: ["cpf"],
  funcao: ["cargo", "funcao"],
  dataAdmissao: ["admissao", "data de admissao", "data admissao"],
  salarioBase: ["salario base", "salario"],
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .trim()
    .toLowerCase()
}

function encontrarColuna(cabecalhos: string[], campo: keyof typeof ALIASES): string | null {
  const alvo = cabecalhos.find((cabecalho) => ALIASES[campo].includes(normalizar(cabecalho)))
  return alvo ?? null
}

function serialParaData(serial: number): Date {
  const dias = Math.floor(serial - 25569)
  return new Date(dias * 86400 * 1000)
}

function parseData(valor: unknown): string {
  if (!valor) return ""
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10)
  }
  if (typeof valor === "number") {
    return serialParaData(valor).toISOString().slice(0, 10)
  }
  if (typeof valor === "string") {
    const texto = valor.trim()
    const dataBr = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
    if (dataBr) {
      const [, dia, mes, ano] = dataBr
      const anoCompleto = ano.length === 2 ? `20${ano}` : ano
      return `${anoCompleto}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto
  }
  return ""
}

function parseValorMonetario(valor: unknown): number {
  if (typeof valor === "number") return valor
  if (typeof valor !== "string") return 0
  const limpo = valor.replace(/[^\d,.-]/g, "")
  if (!limpo) return 0
  const numero = limpo.includes(",")
    ? Number(limpo.replace(/\./g, "").replace(",", "."))
    : Number(limpo)
  return Number.isFinite(numero) ? numero : 0
}

export function lerWorkbookFuncionarios(data: ArrayBuffer) {
  return XLSX.read(data, { type: "array", cellDates: true })
}

export function extrairFuncionarios(workbook: XLSX.WorkBook): FuncionarioImportado[] {
  const abaPrincipal = workbook.SheetNames[0]
  const sheet = workbook.Sheets[abaPrincipal]
  if (!sheet) return []

  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  if (linhas.length === 0) return []

  const cabecalhos = Object.keys(linhas[0])
  const colunaNome = encontrarColuna(cabecalhos, "nome")
  const colunaCpf = encontrarColuna(cabecalhos, "cpf")
  const colunaFuncao = encontrarColuna(cabecalhos, "funcao")
  const colunaAdmissao = encontrarColuna(cabecalhos, "dataAdmissao")
  const colunaSalario = encontrarColuna(cabecalhos, "salarioBase")

  const funcionarios: FuncionarioImportado[] = []
  linhas.forEach((linha, index) => {
    const nome = colunaNome ? String(linha[colunaNome] ?? "").trim() : ""
    if (!nome) return
    funcionarios.push({
      linha: index + 2,
      nome,
      cpf: colunaCpf ? String(linha[colunaCpf] ?? "").trim() : "",
      funcao: colunaFuncao ? String(linha[colunaFuncao] ?? "").trim() : "",
      dataAdmissao: colunaAdmissao ? parseData(linha[colunaAdmissao]) : "",
      salarioBase: colunaSalario ? parseValorMonetario(linha[colunaSalario]) : 0,
      incluir: true,
    })
  })
  return funcionarios
}
