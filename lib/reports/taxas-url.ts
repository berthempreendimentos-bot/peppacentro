import type { TaxasTributos } from "@/lib/calculo-folha"

// Os relatórios (Excel/PDF) rodam no servidor e não têm acesso ao
// localStorage onde a Configuração de Tributos fica salva no navegador.
// Por isso o cliente envia as taxas atuais como query params ao baixar o
// arquivo, garantindo que o relatório reflita a mesma configuração vista
// na tela. Sem os params (ou com valor inválido), aplica-se o padrão do
// sistema — ver calcularEncargos/somarTotais em lib/calculo-folha.ts.
function lerNumero(searchParams: URLSearchParams, chave: string): number | null {
  const bruto = searchParams.get(chave)
  if (bruto === null || bruto === "") return null
  const valor = Number(bruto)
  return Number.isFinite(valor) && valor >= 0 ? valor : null
}

export function lerTaxasDaUrl(searchParams: URLSearchParams): TaxasTributos | undefined {
  const fgts = lerNumero(searchParams, "fgts")
  const inssPatronal = lerNumero(searchParams, "inssPatronal")
  const rat = lerNumero(searchParams, "rat")
  const terceiros = lerNumero(searchParams, "terceiros")
  const descVa = lerNumero(searchParams, "descVa")

  if (fgts === null || inssPatronal === null || rat === null || terceiros === null || descVa === null) {
    return undefined
  }

  return { fgts, inssPatronal, rat, terceiros, descVa }
}
