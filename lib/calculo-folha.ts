export const TAXA_DESC_VT = 0.06
export const TAXA_PERICULOSIDADE = 0.3
export const TAXA_DESC_VA = 0.1
export const TAXA_FGTS = 0.08
export const TAXA_INSS_PATRONAL = 0.2
export const TAXA_RAT = 0.03
export const TAXA_TERCEIROS = 0.058

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
  recebe_periculosidade: boolean
}

export function calcularEncargos(funcionario: FuncionarioBase) {
  const periculosidadeValor = funcionario.recebe_periculosidade
    ? funcionario.salario_base * TAXA_PERICULOSIDADE
    : 0
  const descVt = funcionario.vt_informado > 0 ? funcionario.salario_base * TAXA_DESC_VT : 0
  const descVa = funcionario.vr_informado * TAXA_DESC_VA
  const baseInss = funcionario.salario_base + periculosidadeValor
  const inssEmpregadoValor = calcularInssEmpregado(baseInss)
  const inssAliquotaMarginal = obterAliquotaInssMarginal(baseInss)

  const baseEncargos = funcionario.salario_base + periculosidadeValor
  const fgts = baseEncargos * TAXA_FGTS
  const inssPatronal = baseEncargos * TAXA_INSS_PATRONAL
  const rat = baseEncargos * TAXA_RAT
  const terceiros = baseEncargos * TAXA_TERCEIROS

  const liquido = funcionario.salario_base - descVt - inssEmpregadoValor - descVa

  const totalEncargos = fgts + inssPatronal + rat + terceiros
  const custoEmpresa =
    funcionario.salario_base + funcionario.vt_informado + funcionario.vr_informado + totalEncargos

  return {
    periculosidadeValor,
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
  vtInformado: 0,
  vrInformado: 0,
  descVt: 0,
  periculosidadeValor: 0,
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

export function somarTotais(funcionarios: FuncionarioBase[]): TotaisFolha {
  return funcionarios.reduce((acc, funcionario) => {
    const encargos = calcularEncargos(funcionario)
    return {
      quantidade: acc.quantidade + 1,
      salarioBase: acc.salarioBase + funcionario.salario_base,
      vtInformado: acc.vtInformado + funcionario.vt_informado,
      vrInformado: acc.vrInformado + funcionario.vr_informado,
      descVt: acc.descVt + encargos.descVt,
      periculosidadeValor: acc.periculosidadeValor + encargos.periculosidadeValor,
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
