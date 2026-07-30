import type { GrauInsalubridade } from "@/lib/supabase/database.types"

export const TAXA_DESC_VT = 0.06
export const TAXA_PERICULOSIDADE = 0.3
export const TAXA_DESC_VA = 0.1
export const TAXA_FGTS = 0.08
export const TAXA_INSS_PATRONAL = 0.2
export const TAXA_RAT = 0.03
export const TAXA_TERCEIROS = 0.058

// Insalubridade é calculada sobre o salário mínimo (não sobre o salário do
// funcionário), em 3 graus possíveis — diferente da periculosidade.
export const SALARIO_MINIMO = 1610.0
export const TAXA_INSALUBRIDADE: Record<GrauInsalubridade, number> = {
  nenhum: 0,
  minimo: 0.1,
  medio: 0.2,
  maximo: 0.4,
}

// Percentuais da "Conta-Depósito Vinculada" (Módulo 4.2 / IN 5-2017),
// aplicados diretamente sobre a Remuneração Total do funcionário.
export const TAXA_DECIMO_TERCEIRO = 0.0833
export const TAXA_FERIAS_ADICIONAL = 0.121
export const TAXA_INCIDENCIA_SUBMODULO_22 = 0.0782
export const TAXA_MULTA_FGTS = 0.04
export const TAXA_TOTAL_RETENCAO_MENSAL =
  TAXA_DECIMO_TERCEIRO + TAXA_FERIAS_ADICIONAL + TAXA_INCIDENCIA_SUBMODULO_22 + TAXA_MULTA_FGTS

// Tabela progressiva do INSS (empregado CLT): cada faixa é tributada só na
// parte do salário que cai dentro dela, até o teto da Previdência Social.
const FAIXAS_INSS_EMPREGADO = [
  { limite: 1621.0, aliquota: 0.075 },
  { limite: 2902.84, aliquota: 0.09 },
  { limite: 4354.27, aliquota: 0.12 },
  { limite: 8475.55, aliquota: 0.14 },
]

export function calcularInssEmpregado(salarioBase: number): number {
  const teto = FAIXAS_INSS_EMPREGADO[FAIXAS_INSS_EMPREGADO.length - 1].limite
  const salario = Math.min(salarioBase, teto)

  let inss = 0
  let limiteAnterior = 0
  for (const faixa of FAIXAS_INSS_EMPREGADO) {
    if (salario <= limiteAnterior) break
    const baseFaixa = Math.min(salario, faixa.limite) - limiteAnterior
    inss += baseFaixa * faixa.aliquota
    limiteAnterior = faixa.limite
  }
  return inss
}

// Alíquota da faixa mais alta atingida pelo salário (alíquota marginal),
// usada só para exibição ao lado do valor de INSS na tela.
export function obterAliquotaInssMarginal(salarioBase: number): number {
  const teto = FAIXAS_INSS_EMPREGADO[FAIXAS_INSS_EMPREGADO.length - 1].limite
  const salario = Math.min(salarioBase, teto)
  const faixa = FAIXAS_INSS_EMPREGADO.find((f) => salario <= f.limite)
  return (faixa ?? FAIXAS_INSS_EMPREGADO[FAIXAS_INSS_EMPREGADO.length - 1]).aliquota
}

export type FuncionarioBase = {
  salario_base: number
  vt_informado: number
  vr_informado: number
  faltas?: number
  reembolso?: number
  reembolso_creche?: number
  recebe_periculosidade: boolean
  grau_insalubridade: GrauInsalubridade
}

export type TaxasTributos = {
  fgts: number
  inssPatronal: number
  rat: number
  terceiros: number
  descVa: number
}

export function calcularEncargos(funcionario: FuncionarioBase, taxas?: TaxasTributos) {
  const t = taxas ?? { fgts: TAXA_FGTS, inssPatronal: TAXA_INSS_PATRONAL, rat: TAXA_RAT, terceiros: TAXA_TERCEIROS, descVa: TAXA_DESC_VA }
  
  const salarioBase = funcionario.salario_base ?? 0
  const vtInformado = funcionario.vt_informado ?? 0
  const vrInformado = funcionario.vr_informado ?? 0
  const faltas = funcionario.faltas ?? 0
  const reembolso = funcionario.reembolso ?? 0
  const reembolsoCreche = funcionario.reembolso_creche ?? 0
  const recebePericulosidade = funcionario.recebe_periculosidade ?? false
  const grauInsalubridade = funcionario.grau_insalubridade ?? "nenhum"
  
  const salarioLiquidoBase = Math.max(0, salarioBase - faltas)

  const periculosidadeValor = recebePericulosidade
    ? salarioLiquidoBase * TAXA_PERICULOSIDADE
    : 0
  const insalubridadeValor = (TAXA_INSALUBRIDADE[grauInsalubridade] ?? 0) * SALARIO_MINIMO
  const descVt = vtInformado > 0 ? salarioLiquidoBase * TAXA_DESC_VT : 0
  const descVa = vrInformado * t.descVa
  const baseInss = salarioLiquidoBase + periculosidadeValor
  const inssEmpregadoValor = calcularInssEmpregado(baseInss)
  const inssAliquotaMarginal = obterAliquotaInssMarginal(baseInss)

  const baseEncargos = salarioLiquidoBase + periculosidadeValor
  const fgts = baseEncargos * t.fgts
  const inssPatronal = baseEncargos * t.inssPatronal
  const rat = baseEncargos * t.rat
  const terceiros = baseEncargos * t.terceiros

  const liquido = salarioLiquidoBase - descVt - inssEmpregadoValor - descVa + reembolso + reembolsoCreche

  const totalEncargos = fgts + inssPatronal + rat + terceiros
  const custoEmpresa =
    salarioLiquidoBase + vtInformado + vrInformado + totalEncargos + reembolso + reembolsoCreche

  const remuneracaoTotal = salarioLiquidoBase + periculosidadeValor + insalubridadeValor

  return {
    periculosidadeValor,
    insalubridadeValor,
    remuneracaoTotal,
    descVt,
    descVa,
    inssEmpregadoValor,
    inssAliquotaMarginal,
    fgts,
    inssPatronal,
    rat,
    terceiros,
    liquido,
    totalEncargos,
    custoEmpresa,
  }
}

const TOTAIS_VAZIOS = {
  quantidade: 0,
  salarioBase: 0,
  faltas: 0,
  reembolso: 0,
  reembolso_creche: 0,
  vtInformado: 0,
  vrInformado: 0,
  descVt: 0,
  periculosidadeValor: 0,
  insalubridadeValor: 0,
  remuneracaoTotal: 0,
  inssEmpregadoValor: 0,
  descVa: 0,
  liquido: 0,
  fgts: 0,
  inssPatronal: 0,
  rat: 0,
  terceiros: 0,
  totalEncargos: 0,
  custoEmpresa: 0,
}

export type TotaisFolha = typeof TOTAIS_VAZIOS

export function somarTotais(funcionarios: FuncionarioBase[], taxas?: TaxasTributos): TotaisFolha {
  return funcionarios.reduce((acc, funcionario) => {
    const encargos = calcularEncargos(funcionario, taxas)
    return {
      quantidade: acc.quantidade + 1,
      salarioBase: acc.salarioBase + (funcionario.salario_base ?? 0),
      faltas: acc.faltas + (funcionario.faltas ?? 0),
      reembolso: acc.reembolso + (funcionario.reembolso ?? 0),
      reembolso_creche: acc.reembolso_creche + (funcionario.reembolso_creche ?? 0),
      vtInformado: acc.vtInformado + (funcionario.vt_informado ?? 0),
      vrInformado: acc.vrInformado + (funcionario.vr_informado ?? 0),
      descVt: acc.descVt + encargos.descVt,
      periculosidadeValor: acc.periculosidadeValor + encargos.periculosidadeValor,
      insalubridadeValor: acc.insalubridadeValor + encargos.insalubridadeValor,
      remuneracaoTotal: acc.remuneracaoTotal + encargos.remuneracaoTotal,
      inssEmpregadoValor: acc.inssEmpregadoValor + encargos.inssEmpregadoValor,
      descVa: acc.descVa + encargos.descVa,
      liquido: acc.liquido + encargos.liquido,
      fgts: acc.fgts + encargos.fgts,
      inssPatronal: acc.inssPatronal + encargos.inssPatronal,
      rat: acc.rat + encargos.rat,
      terceiros: acc.terceiros + encargos.terceiros,
      totalEncargos: acc.totalEncargos + encargos.totalEncargos,
      custoEmpresa: acc.custoEmpresa + encargos.custoEmpresa,
    }
  }, TOTAIS_VAZIOS)
}

export function calcularContaDepositoVinculada(remuneracaoTotal: number) {
  const decimoTerceiro = remuneracaoTotal * TAXA_DECIMO_TERCEIRO
  const feriasAdicional = remuneracaoTotal * TAXA_FERIAS_ADICIONAL
  const incidenciaSubmodulo22 = remuneracaoTotal * TAXA_INCIDENCIA_SUBMODULO_22
  const multaFgts = remuneracaoTotal * TAXA_MULTA_FGTS
  const totalRetencaoMensal = decimoTerceiro + feriasAdicional + incidenciaSubmodulo22 + multaFgts

  return {
    decimoTerceiro,
    feriasAdicional,
    incidenciaSubmodulo22,
    multaFgts,
    totalRetencaoMensal,
  }
}
