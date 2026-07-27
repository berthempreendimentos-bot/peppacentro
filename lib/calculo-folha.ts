export const TAXA_DESC_VT = 0.06
export const TAXA_PERICULOSIDADE = 0.3
export const TAXA_DESC_VA = 0.1
export const TAXA_FGTS = 0.08
export const TAXA_INSS_PATRONAL = 0.2
export const TAXA_RAT = 0.03
export const TAXA_TERCEIROS = 0.058

export type FuncionarioBase = {
  salario_base: number
  vt_informado: number
  vr_informado: number
  recebe_periculosidade: boolean
  inss_percentual: number
}

export function calcularEncargos(funcionario: FuncionarioBase) {
  const periculosidadeValor = funcionario.recebe_periculosidade
    ? funcionario.salario_base * TAXA_PERICULOSIDADE
    : 0
  const descVt = funcionario.vt_informado > 0 ? funcionario.salario_base * TAXA_DESC_VT : 0
  const descVa = funcionario.vr_informado * TAXA_DESC_VA
  const inssEmpregadoValor = funcionario.salario_base * (funcionario.inss_percentual / 100)

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
    fgts,
    inssPatronal,
    rat,
    terceiros,
    liquido,
    totalEncargos,
    custoEmpresa,
  }
}
