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

function limparDescricaoCandidata(texto: string): string {
  return texto
    .replace(/\s+/g, " ")
    .replace(/^[❖➢➤•▪◦*\-–—]+\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\s*[❖➢➤•▪◦]+\s*$/, "")
    .trim()
}

// Tenta encontrar uma tabela "ITEM/SERVIÇO ... VALOR" no texto do PDF e
// extrair cada linha como um item candidato com sua descrição e preço.
// Sempre tratar como sugestão — mostrar para o usuário revisar/excluir antes
// de criar os itens de fato.
export function extrairItensCandidatos(
  texto: string
): { descricao: string; valor: number }[] {
  const linhas = texto.split("\n")
  const headerIdx = linhas.findIndex((linha) => {
    const norm = normalizar(linha)
    return norm.includes("item") && (norm.includes("valor") || norm.includes("preco"))
  })
  if (headerIdx === -1) return []

  const itens: { descricao: string; valor: number }[] = []
  let bufferDescricao: string[] = []

  for (let i = headerIdx + 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(linha.trim())) break
    if (linha.trim() === "") continue

    const preco = extrairPrecoDoTrecho(linha)
    if (preco !== null) {
      const textoAntesDoPreco = linha
        .replace(/(?:r\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2}/i, "")
        .trim()
      if (textoAntesDoPreco) bufferDescricao.push(textoAntesDoPreco)
      const descricao = limparDescricaoCandidata(bufferDescricao.join(" "))
      if (descricao) itens.push({ descricao, valor: preco })
      bufferDescricao = []
    } else {
      bufferDescricao.push(linha)
    }
  }

  return itens
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
