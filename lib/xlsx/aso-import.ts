import * as XLSX from "xlsx"

export type AsoImportado = {
  linha: number
  nome: string
  cpf: string
  valor: number
  funcionarioId: string | null
  incluir: boolean
}

const ALIASES: Record<"nome" | "cpf" | "valor", string[]> = {
  nome: ["nome"],
  cpf: ["cpf"],
  valor: ["valor", "valor do aso", "valor aso"],
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .trim()
    .toLowerCase()
}

function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, "")
}

function encontrarColuna(cabecalhos: string[], campo: keyof typeof ALIASES): string | null {
  const alvo = cabecalhos.find((cabecalho) => ALIASES[campo].includes(normalizar(cabecalho)))
  return alvo ?? null
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

export function lerWorkbookAso(data: ArrayBuffer) {
  return XLSX.read(data, { type: "array", cellDates: true })
}

// Casa cada linha importada com um funcionário do contrato pelo CPF
// (só dígitos) e, se não achar, tenta pelo nome (normalizado, sem acento).
export function extrairAso(
  workbook: XLSX.WorkBook,
  funcionarios: { id: string; nome: string; cpf: string | null }[]
): AsoImportado[] {
  const abaPrincipal = workbook.SheetNames[0]
  const sheet = workbook.Sheets[abaPrincipal]
  if (!sheet) return []

  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  if (linhas.length === 0) return []

  const cabecalhos = Object.keys(linhas[0])
  const colunaNome = encontrarColuna(cabecalhos, "nome")
  const colunaCpf = encontrarColuna(cabecalhos, "cpf")
  const colunaValor = encontrarColuna(cabecalhos, "valor")

  const porCpf = new Map(
    funcionarios.filter((f) => f.cpf).map((f) => [apenasDigitos(f.cpf as string), f])
  )
  const porNome = new Map(funcionarios.map((f) => [normalizar(f.nome), f]))

  const resultado: AsoImportado[] = []
  linhas.forEach((linha, index) => {
    const nome = colunaNome ? String(linha[colunaNome] ?? "").trim() : ""
    if (!nome) return

    const cpf = colunaCpf ? String(linha[colunaCpf] ?? "").trim() : ""
    const cpfDigitos = apenasDigitos(cpf)
    const funcionario = porCpf.get(cpfDigitos) ?? porNome.get(normalizar(nome)) ?? null

    resultado.push({
      linha: index + 2,
      nome,
      cpf,
      valor: colunaValor ? parseValorMonetario(linha[colunaValor]) : 0,
      funcionarioId: funcionario?.id ?? null,
      incluir: true,
    })
  })
  return resultado
}
