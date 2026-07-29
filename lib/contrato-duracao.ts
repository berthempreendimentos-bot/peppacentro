export const DURACAO_PADRAO_MESES = 12

// Duração do contrato em meses, usada para estimar o valor mensal
// (valor_atual / duração) quando não há uma parcela mensal cadastrada.
// Sem data_inicio/data_fim, assume a duração padrão (12 meses).
export function calcularDuracaoContrato(dataInicio: string | null, dataFim: string | null) {
  if (!dataInicio || !dataFim) {
    return { atual: null, total: DURACAO_PADRAO_MESES, estimado: true }
  }

  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)
  const hoje = new Date()

  const total = Math.max(
    1,
    (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()) + 1
  )
  const atual = Math.min(
    Math.max(
      (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1,
      1
    ),
    total
  )

  return { atual, total, estimado: false }
}
