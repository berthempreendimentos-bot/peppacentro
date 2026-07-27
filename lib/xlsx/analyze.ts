import * as XLSX from "xlsx"

// Categorias baseadas no modelo oficial da Planilha de Custos e Formação de
// Preços (Anexo da IN 5/2017): 6 módulos de custo por posto, além de EPI e
// Ferramenta como itens à parte (não previstos como seção própria no modelo,
// mas classificáveis manualmente linha a linha).
export type LinhaCategoria =
  | "modulo_1"
  | "modulo_2"
  | "modulo_3"
  | "modulo_4"
  | "modulo_5"
  | "modulo_6"
  | "epi"
  | "ferramenta"
  | "ignorar"

export const linhaCategoriaOptions: { value: LinhaCategoria; label: string }[] = [
  { value: "modulo_1", label: "Módulo 1 — Remuneração" },
  { value: "modulo_2", label: "Módulo 2 — Encargos e Benefícios" },
  { value: "modulo_3", label: "Módulo 3 — Provisão para Rescisão" },
  { value: "modulo_4", label: "Módulo 4 — Reposição do Profissional" },
  { value: "modulo_5", label: "Módulo 5 — Insumos Diversos" },
  { value: "modulo_6", label: "Módulo 6 — Indiretos, Tributos e Lucro" },
  { value: "epi", label: "EPI" },
  { value: "ferramenta", label: "Ferramenta" },
  { value: "ignorar", label: "Ignorar" },
]

export type LinhaPlanilha = {
  linha: number
  descricao: string
  quantidade: number | null
  valor: number | null
  categoria: LinhaCategoria
  // Marca a linha "TOTAL DO MÓDULO N" — o valor que define o total do
  // módulo (as demais linhas do módulo são só itens de detalhe, exibidos
  // mas não somados de novo, para não contar em dobro).
  ehTotalModulo: boolean
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function classificarLinha(
  texto: string,
  moduloAtual: number | null
): { categoria: LinhaCategoria; ehTotalModulo: boolean } {
  // "TOTAL SUBMÓDULO x.y" é parcial (já somado dentro do TOTAL DO MÓDULO
  // correspondente) — ignorar para não contar em dobro.
  if (texto.includes("submodulo")) return { categoria: "ignorar", ehTotalModulo: false }

  const totalMatch = texto.match(/total\s+(do\s+)?modulo\s*([1-6])/)
  if (totalMatch) {
    return { categoria: `modulo_${totalMatch[2]}` as LinhaCategoria, ehTotalModulo: true }
  }

  if (texto.includes("epi")) return { categoria: "epi", ehTotalModulo: false }
  if (texto.includes("ferramenta")) return { categoria: "ferramenta", ehTotalModulo: false }

  // Linha de detalhe dentro de uma seção de módulo reconhecida (ex.:
  // "Uniformes" dentro do Módulo 5): entra como item do módulo para
  // exibição. O total do módulo continua vindo só da linha "TOTAL DO
  // MÓDULO N" (ver somarModulo), então isso não conta em dobro.
  if (moduloAtual !== null) {
    return { categoria: `modulo_${moduloAtual}` as LinhaCategoria, ehTotalModulo: false }
  }

  return { categoria: "ignorar", ehTotalModulo: false }
}

export function lerWorkbook(data: ArrayBuffer) {
  return XLSX.read(data, { type: "array" })
}

export function listarAbas(workbook: XLSX.WorkBook) {
  return workbook.SheetNames
}

function lerLinhaBruta(row: unknown[]) {
  const cells = row.filter((c) => c !== "" && c !== null && c !== undefined)
  if (cells.length === 0) return null

  const descricaoCell = row.find(
    (c) => typeof c === "string" && c.trim().length > 1
  ) as string | undefined
  if (!descricaoCell) return null

  const numeros = row.filter((c) => typeof c === "number") as number[]
  // A última coluna numérica é o valor em R$ (a penúltima, quando existe,
  // costuma ser o percentual daquele item sobre a remuneração/quantidade).
  const valor = numeros.length > 0 ? numeros[numeros.length - 1] : null
  const quantidade = numeros.length > 2 ? numeros[0] : null

  return { descricao: descricaoCell.trim(), valor, quantidade }
}

export type ItemSimples = {
  linha: number
  descricao: string
  quantidade: number | null
  valor: number | null
  incluir: boolean
}

// Extrai uma lista simples de itens (nome + valor) de uma aba, sem a
// lógica de módulos — usada para abas de Ferramentas e Serviços, que são
// só uma lista de itens com valor, não um detalhamento por módulo.
export function extrairItensSimples(workbook: XLSX.WorkBook, aba: string): ItemSimples[] {
  const sheet = workbook.Sheets[aba]
  if (!sheet) return []

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })
  const itens: ItemSimples[] = []

  grid.forEach((row, index) => {
    const linha = lerLinhaBruta(row)
    if (!linha || linha.valor === null) return

    itens.push({
      linha: index + 1,
      descricao: linha.descricao,
      quantidade: linha.quantidade,
      valor: linha.valor,
      incluir: true,
    })
  })

  return itens
}

export function extrairLinhas(workbook: XLSX.WorkBook, aba: string): LinhaPlanilha[] {
  const sheet = workbook.Sheets[aba]
  if (!sheet) return []

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })
  const linhas: LinhaPlanilha[] = []
  let moduloAtual: number | null = null

  grid.forEach((row, index) => {
    const linhaBruta = lerLinhaBruta(row)
    if (!linhaBruta) return
    const { descricao: descricaoCell, valor, quantidade } = linhaBruta

    const texto = normalizar(descricaoCell)

    // Título de seção (ex.: "MÓDULO 5 - INSUMOS DIVERSOS"), sem valor
    // próprio — marca que as próximas linhas pertencem a esse módulo.
    // Uma linha do quadro-resumo final (ex.: "MÓDULO 1 – ... 3.536,07")
    // tem valor, então não é confundida com o título da seção.
    const headerMatch = texto.match(/^modulo\s*([1-6])\b/)
    if (headerMatch && valor === null) {
      moduloAtual = Number(headerMatch[1])
    }

    // Linhas sem nenhum valor numérico são cabeçalho/rodapé/instrução do
    // modelo (nº do processo, licitação, data, município, título de seção
    // etc.) — não são dados de custo, então nem entram na lista de revisão.
    if (valor === null) return

    const { categoria, ehTotalModulo } = classificarLinha(texto, moduloAtual)

    // Ao fechar um módulo (linha "TOTAL DO MÓDULO N"), some as próximas
    // linhas soltas (ex.: quadro-resumo final) não devem herdar esse
    // módulo por engano.
    if (ehTotalModulo) moduloAtual = null

    linhas.push({
      linha: index + 1,
      descricao: descricaoCell,
      quantidade,
      valor,
      categoria,
      ehTotalModulo,
    })
  })

  return linhas
}

export function somarModulo(linhas: LinhaPlanilha[], modulo: 1 | 2 | 3 | 4 | 5 | 6) {
  const doModulo = linhas.filter((l) => l.categoria === `modulo_${modulo}`)
  const totalRow = doModulo.find((l) => l.ehTotalModulo)
  if (totalRow) return totalRow.valor ?? 0
  return doModulo.reduce((acc, l) => acc + (l.valor ?? 0), 0)
}

export function somarTodosModulos(linhas: LinhaPlanilha[]) {
  return ([1, 2, 3, 4, 5, 6] as const).reduce((acc, n) => acc + somarModulo(linhas, n), 0)
}
