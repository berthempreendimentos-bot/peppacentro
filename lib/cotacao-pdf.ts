// Heurística para sugerir o preço de cada item da cotação a partir do texto
// bruto extraído do PDF. Sempre tratar como sugestão — o usuário confirma
// ou ajusta na tela de revisão antes de salvar.

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

function extrairPrecoDaLinha(linha: string): number | null {
  const matches = linha.match(/(?:r\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2}/gi)
  if (!matches || matches.length === 0) return null
  const ultimo = matches[matches.length - 1].replace(/r\$\s*/i, "").trim()
  if (ultimo.includes(",")) {
    return Number(ultimo.replace(/\./g, "").replace(",", "."))
  }
  return Number(ultimo)
}

export function sugerirPrecos(
  texto: string,
  itens: { id: string; descricao: string }[]
): Record<string, number | null> {
  const linhas = texto.split("\n")
  const sugestoes: Record<string, number | null> = {}

  for (const item of itens) {
    const alvo = normalizar(item.descricao)
    const primeiraPalavra = alvo.split(" ")[0] ?? ""
    let encontrado: number | null = null

    for (const linha of linhas) {
      const linhaNorm = normalizar(linha)
      const combina =
        linhaNorm.includes(alvo) || (primeiraPalavra.length > 3 && linhaNorm.includes(primeiraPalavra))
      if (!combina) continue
      const preco = extrairPrecoDaLinha(linha)
      if (preco !== null) {
        encontrado = preco
        break
      }
    }

    sugestoes[item.id] = encontrado
  }

  return sugestoes
}
