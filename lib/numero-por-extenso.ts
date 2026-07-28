const UNIDADES = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
]
const DEZ_A_DEZENOVE = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
]
const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
]
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
]

function grupoPorExtenso(n: number): string {
  if (n === 0) return ""
  if (n === 100) return "cem"

  const centena = Math.floor(n / 100)
  const resto = n % 100
  const partes: string[] = []

  if (centena > 0) partes.push(CENTENAS[centena])

  if (resto >= 10 && resto <= 19) {
    partes.push(DEZ_A_DEZENOVE[resto - 10])
  } else {
    const dezena = Math.floor(resto / 10)
    const unidade = resto % 10
    if (dezena > 0) partes.push(DEZENAS[dezena])
    if (unidade > 0) partes.push(UNIDADES[unidade])
  }

  return partes.join(" e ")
}

const ESCALAS: [number, string, string][] = [
  [1_000_000_000, "bilhão", "bilhões"],
  [1_000_000, "milhão", "milhões"],
  [1_000, "mil", "mil"],
]

function inteiroPorExtenso(valor: number): string {
  if (valor === 0) return "zero"

  const grupos: string[] = []
  let resto = valor

  for (const [escala, singular, plural] of ESCALAS) {
    const quantidade = Math.floor(resto / escala)
    if (quantidade > 0) {
      const texto =
        escala === 1000 && quantidade === 1 ? "mil" : `${grupoPorExtenso(quantidade)} ${quantidade === 1 ? singular : plural}`
      grupos.push(texto)
      resto %= escala
    }
  }

  if (resto > 0) grupos.push(grupoPorExtenso(resto))

  if (grupos.length <= 1) return grupos.join("")

  const ultimo = grupos[grupos.length - 1]
  const anteriores = grupos.slice(0, -1)
  const usaVirgula = grupos.length > 2
  const juntor = resto > 0 && resto < 100 ? " e " : (usaVirgula ? ", " : " e ")

  return anteriores.join(", ") + juntor + ultimo
}

// Converte um valor em reais para sua forma escrita por extenso, no
// padrão usado em documentos financeiros formais (ex: cheques, espelhos
// de medição): "duzentos e quarenta e oito mil, cinquenta e dois reais
// e dezoito centavos".
export function valorPorExtenso(valor: number): string {
  const valorArredondado = Math.round(Math.abs(valor) * 100) / 100
  const reais = Math.floor(valorArredondado)
  const centavos = Math.round((valorArredondado - reais) * 100)

  const partes: string[] = []

  if (reais > 0) {
    const palavraReais = reais === 1 ? "real" : "reais"
    partes.push(`${inteiroPorExtenso(reais)} ${palavraReais}`)
  }

  if (centavos > 0) {
    const palavraCentavos = centavos === 1 ? "centavo" : "centavos"
    partes.push(`${inteiroPorExtenso(centavos)} ${palavraCentavos}`)
  }

  if (partes.length === 0) return "zero reais"

  return partes.join(" e ")
}
