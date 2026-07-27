import { criarQueriesListaContrato } from "@/lib/queries/itens-lista-contrato"

export const {
  useLista: useFerramentasContrato,
  useAdicionarItem: useAdicionarFerramentaContrato,
  useImportarItens: useImportarFerramentasContrato,
  useExcluirItem: useExcluirFerramentaContrato,
} = criarQueriesListaContrato("ferramentas_contrato")
