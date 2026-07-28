import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

import { formatCurrencyBRL, formatDate } from "@/lib/format"

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 16 },
  table: { display: "flex", width: "100%" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e5e5", paddingVertical: 6 },
  headerRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#111111", paddingVertical: 6 },
  headerCell: { fontFamily: "Helvetica-Bold" },
  cell: { flex: 1 },
})

type ContratoRow = {
  numero: string
  cliente: string
  situacao: string
  valorAtual: number
  fim: string | null
}

export function ContratosPdfDocument({ contratos }: { contratos: ContratoRow[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de Contratos</Text>
        <Text style={styles.subtitle}>Gerado em {formatDate(new Date().toISOString())}</Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.headerCell]}>Número</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Cliente</Text>
            <Text style={[styles.cell, styles.headerCell]}>Situação</Text>
            <Text style={[styles.cell, styles.headerCell]}>Valor Atual</Text>
            <Text style={[styles.cell, styles.headerCell]}>Fim</Text>
          </View>
          {contratos.map((c, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.cell}>{c.numero}</Text>
              <Text style={[styles.cell, { flex: 2 }]}>{c.cliente}</Text>
              <Text style={styles.cell}>{c.situacao}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(c.valorAtual)}</Text>
              <Text style={styles.cell}>{formatDate(c.fim)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

type LancamentoRow = {
  data: string
  contrato: string
  tipo: string
  descricao: string
  valor: number
  status: string
}

export function FinanceiroPdfDocument({
  lancamentos,
  totalReceitas,
  totalDespesas,
}: {
  lancamentos: LancamentoRow[]
  totalReceitas: number
  totalDespesas: number
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório Financeiro</Text>
        <Text style={styles.subtitle}>Gerado em {formatDate(new Date().toISOString())}</Text>
        <View style={{ marginBottom: 16, flexDirection: "row", gap: 24 }}>
          <Text>Receitas/Recebimentos: {formatCurrencyBRL(totalReceitas)}</Text>
          <Text>Despesas/Pagamentos: {formatCurrencyBRL(totalDespesas)}</Text>
          <Text>Saldo: {formatCurrencyBRL(totalReceitas - totalDespesas)}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.headerCell]}>Data</Text>
            <Text style={[styles.cell, styles.headerCell]}>Contrato</Text>
            <Text style={[styles.cell, styles.headerCell]}>Tipo</Text>
            <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Descrição</Text>
            <Text style={[styles.cell, styles.headerCell]}>Valor</Text>
            <Text style={[styles.cell, styles.headerCell]}>Status</Text>
          </View>
          {lancamentos.map((l, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.cell}>{formatDate(l.data)}</Text>
              <Text style={styles.cell}>{l.contrato}</Text>
              <Text style={styles.cell}>{l.tipo}</Text>
              <Text style={[styles.cell, { flex: 2 }]}>{l.descricao}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(l.valor)}</Text>
              <Text style={styles.cell}>{l.status}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

type FuncionarioFolhaRow = {
  nome: string
  funcao: string
  salarioBase: number
  liquido: number
  totalEncargos: number
  custoEmpresa: number
}

type FuncaoResumoRow = {
  funcao: string
  quantidade: number
  salarioBase: number
  liquido: number
  totalEncargos: number
  custoEmpresa: number
}

const COR_TITULO_BG = "#ffd700"
const COR_TITULO_TEXTO = "#1a1b22"
const COR_SECAO_BG = "#1a1b22"
const COR_SECAO_TEXTO = "#ffffff"
const COR_LINHA_PAR = "#f7f6fb"
const COR_BORDA = "#d0c6ab"

const stylesFolha = StyleSheet.create({
  tituloBarra: {
    backgroundColor: COR_TITULO_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2,
  },
  tituloTexto: { fontSize: 15, fontFamily: "Helvetica-Bold", color: COR_TITULO_TEXTO },
  subtitulo: { fontSize: 9, color: "#666666", marginBottom: 14, paddingHorizontal: 12 },
  kpiCaixa: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COR_BORDA,
    borderRadius: 3,
  },
  kpiItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: COR_BORDA,
  },
  kpiLabel: { fontSize: 7, color: "#666666", marginBottom: 3, textTransform: "uppercase" },
  kpiValor: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  secaoBarra: {
    backgroundColor: COR_SECAO_BG,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  secaoTexto: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COR_SECAO_TEXTO },
  tabelaHeaderRow: {
    flexDirection: "row",
    backgroundColor: COR_SECAO_BG,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tabelaHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 9, color: COR_SECAO_TEXTO },
  tabelaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COR_BORDA,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tabelaRowPar: { backgroundColor: COR_LINHA_PAR },
  tabelaCell: { flex: 1, fontSize: 9 },
})

export function FolhaPagamentoPdfDocument({
  contratoTitulo,
  mesReferencia,
  funcionarios,
  porFuncao,
  totais,
}: {
  contratoTitulo: string
  mesReferencia: string
  funcionarios: FuncionarioFolhaRow[]
  porFuncao: FuncaoResumoRow[]
  totais: {
    quantidade: number
    salarioBase: number
    liquido: number
    totalEncargos: number
    custoEmpresa: number
  }
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={stylesFolha.tituloBarra}>
          <Text style={stylesFolha.tituloTexto}>Folha de Pagamento — {contratoTitulo}</Text>
        </View>
        <Text style={stylesFolha.subtitulo}>
          Referência: {mesReferencia} · Gerado em {formatDate(new Date().toISOString())}
        </Text>

        <View style={stylesFolha.kpiCaixa}>
          <View style={stylesFolha.kpiItem}>
            <Text style={stylesFolha.kpiLabel}>Funcionários</Text>
            <Text style={stylesFolha.kpiValor}>{totais.quantidade}</Text>
          </View>
          <View style={stylesFolha.kpiItem}>
            <Text style={stylesFolha.kpiLabel}>Salário Base</Text>
            <Text style={stylesFolha.kpiValor}>{formatCurrencyBRL(totais.salarioBase)}</Text>
          </View>
          <View style={stylesFolha.kpiItem}>
            <Text style={stylesFolha.kpiLabel}>Líquido</Text>
            <Text style={stylesFolha.kpiValor}>{formatCurrencyBRL(totais.liquido)}</Text>
          </View>
          <View style={stylesFolha.kpiItem}>
            <Text style={stylesFolha.kpiLabel}>Encargos Patronais</Text>
            <Text style={stylesFolha.kpiValor}>{formatCurrencyBRL(totais.totalEncargos)}</Text>
          </View>
          <View style={[stylesFolha.kpiItem, { borderRightWidth: 0 }]}>
            <Text style={stylesFolha.kpiLabel}>Custo Total</Text>
            <Text style={stylesFolha.kpiValor}>{formatCurrencyBRL(totais.custoEmpresa)}</Text>
          </View>
        </View>

        <View style={stylesFolha.secaoBarra}>
          <Text style={stylesFolha.secaoTexto}>RESUMO POR FUNÇÃO</Text>
        </View>
        <View style={styles.table}>
          <View style={stylesFolha.tabelaHeaderRow}>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell, { flex: 2 }]}>
              Função
            </Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Qtd.</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Salário Base</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Líquido</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Encargos</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Custo Total</Text>
          </View>
          {porFuncao.map((f, i) => (
            <View
              style={[stylesFolha.tabelaRow, ...(i % 2 === 1 ? [stylesFolha.tabelaRowPar] : [])]}
              key={i}
            >
              <Text style={[stylesFolha.tabelaCell, { flex: 2 }]}>{f.funcao}</Text>
              <Text style={stylesFolha.tabelaCell}>{f.quantidade}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.salarioBase)}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.liquido)}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.totalEncargos)}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.custoEmpresa)}</Text>
            </View>
          ))}
        </View>

        <View style={[stylesFolha.secaoBarra, { marginTop: 20 }]}>
          <Text style={stylesFolha.secaoTexto}>FUNCIONÁRIOS</Text>
        </View>
        <View style={styles.table}>
          <View style={stylesFolha.tabelaHeaderRow}>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell, { flex: 2 }]}>
              Nome
            </Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Função</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Salário Base</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Líquido</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Encargos</Text>
            <Text style={[stylesFolha.tabelaCell, stylesFolha.tabelaHeaderCell]}>Custo Total</Text>
          </View>
          {funcionarios.map((f, i) => (
            <View
              style={[stylesFolha.tabelaRow, ...(i % 2 === 1 ? [stylesFolha.tabelaRowPar] : [])]}
              key={i}
            >
              <Text style={[stylesFolha.tabelaCell, { flex: 2 }]}>{f.nome}</Text>
              <Text style={stylesFolha.tabelaCell}>{f.funcao}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.salarioBase)}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.liquido)}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.totalEncargos)}</Text>
              <Text style={stylesFolha.tabelaCell}>{formatCurrencyBRL(f.custoEmpresa)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
