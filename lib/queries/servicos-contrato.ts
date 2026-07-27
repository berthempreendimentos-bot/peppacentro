import { criarQueriesListaContrato } from "@/lib/queries/itens-lista-contrato"

export const {
  useLista: useServicosContrato,
  useAdicionarItem: useAdicionarServicoContrato,
  useImportarItens: useImportarServicosContrato,
  useExcluirItem: useExcluirServicoContrato,
} = criarQueriesListaContrato("servicos_contrato")
