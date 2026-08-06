// Alíquotas de retenção na fonte para serviços prestados com dedicação
// exclusiva de mão de obra.
// O INSS incide apenas sobre a Mão de Obra (o Valor a Faturar menos VT, VR e Material, quando discriminados na nota), conforme
// art. 121 da IN RFB 971/2009. 
// Os demais tributos (IRRF, PIS, COFINS, CSLL, ISS) incidem sobre o Valor a Faturar.
export const TAXA_RETENCAO_INSS = 0.11
export const TAXA_IRRF = 0.012
export const TAXA_IRRF_SEM_MATERIAL = 0.048
export const TAXA_PIS = 0.0065
export const TAXA_COFINS = 0.03
export const TAXA_CSLL = 0.01

export type ResumoMedicaoInput = {
  maoDeObra: number
  valeTransporte: number
  valeRefeicao: number
  material: number
  issAliquota: number
}

export function calcularResumoMedicao(input: ResumoMedicaoInput) {
  const valorAFaturar =
    input.maoDeObra + input.valeTransporte + input.valeRefeicao + input.material

  const baseRetencao = input.maoDeObra
  const retencaoInss = baseRetencao * TAXA_RETENCAO_INSS
  const taxaIrrfAplicada = input.material > 0 ? TAXA_IRRF : TAXA_IRRF_SEM_MATERIAL
  const irrf = valorAFaturar * taxaIrrfAplicada
  const pis = valorAFaturar * TAXA_PIS
  const cofins = valorAFaturar * TAXA_COFINS
  const csll = valorAFaturar * TAXA_CSLL
  const iss = valorAFaturar * (input.issAliquota / 100)

  const retencaoTotal = retencaoInss + irrf + pis + cofins + csll + iss
  const valorLiquido = valorAFaturar - retencaoTotal

  return {
    valorAFaturar,
    baseRetencao,
    retencaoInss,
    taxaIrrfAplicada,
    irrf,
    pis,
    cofins,
    csll,
    iss,
    retencaoTotal,
    valorLiquido,
  }
}
