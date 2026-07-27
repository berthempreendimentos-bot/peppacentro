// Extração e consulta de CNPJ. A consulta usa a BrasilAPI, que espelha os
// dados públicos da Receita Federal (CNPJ, razão social, situação cadastral
// e endereço), sem necessidade de chave/autenticação.

export function extrairCnpj(texto: string): string | null {
  const match = texto.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
  if (!match) return null
  const digitos = match[0].replace(/\D/g, "")
  return digitos.length === 14 ? digitos : null
}

export function formatarCnpj(cnpj: string): string {
  const digitos = cnpj.replace(/\D/g, "")
  if (digitos.length !== 14) return cnpj
  return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

export type EmpresaCnpj = {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacaoCadastral: string | null
  endereco: string | null
}

export async function buscarEmpresaPorCnpj(cnpj: string): Promise<EmpresaCnpj | null> {
  const limpo = cnpj.replace(/\D/g, "")
  if (limpo.length !== 14) return null

  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`, {
    headers: { "User-Agent": "PepacorpCentro/1.0" },
  })
  if (!resposta.ok) return null

  const dados = await resposta.json()
  const endereco = [dados.logradouro, dados.numero, dados.bairro, dados.municipio, dados.uf]
    .filter(Boolean)
    .join(", ")

  return {
    cnpj: limpo,
    razaoSocial: dados.razao_social ?? "",
    nomeFantasia: dados.nome_fantasia || null,
    situacaoCadastral: dados.descricao_situacao_cadastral || null,
    endereco: endereco || null,
  }
}
