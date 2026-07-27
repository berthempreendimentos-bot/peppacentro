// Heurística para sugerir o preço de cada item da cotação a partir do texto
// bruto extraído do PDF. Sempre tratar como sugestão — o usuário confirma
// ou ajusta na tela de revisão antes de salvar.

const TAMANHO_JANELA = 300

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function extrairPrecoDoTrecho(trecho: string): number | null {
  const matches = trecho.match(/(?:r\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2}/gi)
  if (!matches || matches.length === 0) return null
  const primeiro = matches[0].replace(/r\$\s*/i, "").trim()
  if (primeiro.includes(",")) {
    return Number(primeiro.replace(/\./g, "").replace(",", "."))
  }
  return Number(primeiro)
}

export function sugerirPrecos(
  texto: string,
  itens: { id: string; descricao: string }[]
): Record<string, number | null> {
  const textoNorm = normalizar(texto)
  const sugestoes: Record<string, number | null> = {}

  for (const item of itens) {
    const alvo = normalizar(item.descricao)
    const primeiraPalavra = alvo.split(" ")[0] ?? ""

    let idx = alvo.length > 0 ? textoNorm.indexOf(alvo) : -1
    if (idx === -1 && primeiraPalavra.length > 3) {
      idx = textoNorm.indexOf(primeiraPalavra)
    }

    if (idx === -1) {
      sugestoes[item.id] = null
      continue
    }

    // O preço nem sempre fica na mesma linha da descrição (células de tabela
    // com texto quebrado em várias linhas) — procura numa janela de texto
    // logo após o ponto onde a descrição do item aparece.
    const inicioJanela = idx + Math.max(alvo.length, primeiraPalavra.length)
    const janela = textoNorm.slice(inicioJanela, inicioJanela + TAMANHO_JANELA)
    sugestoes[item.id] = extrairPrecoDoTrecho(janela)
  }

  return sugestoes
}
