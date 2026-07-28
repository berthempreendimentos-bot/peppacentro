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

export function FolhaPagamentoPdfDocument({
  mesReferencia,
  funcionarios,
  porFuncao,
  totais,
}: {
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
        <Text style={styles.title}>Folha de Pagamento</Text>
        <Text style={styles.subtitle}>
          Referência: {mesReferencia} · Gerado em {formatDate(new Date().toISOString())}
        </Text>

        <View style={{ marginBottom: 16, flexDirection: "row", gap: 16 }}>
          <Text>Funcionários: {totais.quantidade}</Text>
          <Text>Salário Base: {formatCurrencyBRL(totais.salarioBase)}</Text>
          <Text>Líquido: {formatCurrencyBRL(totais.liquido)}</Text>
          <Text>Encargos: {formatCurrencyBRL(totais.totalEncargos)}</Text>
          <Text>Custo Total: {formatCurrencyBRL(totais.custoEmpresa)}</Text>
        </View>

        <Text style={[styles.title, { fontSize: 12, marginBottom: 8 }]}>Resumo por função</Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Função</Text>
            <Text style={[styles.cell, styles.headerCell]}>Qtd.</Text>
            <Text style={[styles.cell, styles.headerCell]}>Salário Base</Text>
            <Text style={[styles.cell, styles.headerCell]}>Líquido</Text>
            <Text style={[styles.cell, styles.headerCell]}>Encargos</Text>
            <Text style={[styles.cell, styles.headerCell]}>Custo Total</Text>
          </View>
          {porFuncao.map((f, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, { flex: 2 }]}>{f.funcao}</Text>
              <Text style={styles.cell}>{f.quantidade}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.salarioBase)}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.liquido)}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.totalEncargos)}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.custoEmpresa)}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.title, { fontSize: 12, marginTop: 20, marginBottom: 8 }]}>
          Funcionários
        </Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Nome</Text>
            <Text style={[styles.cell, styles.headerCell]}>Função</Text>
            <Text style={[styles.cell, styles.headerCell]}>Salário Base</Text>
            <Text style={[styles.cell, styles.headerCell]}>Líquido</Text>
            <Text style={[styles.cell, styles.headerCell]}>Encargos</Text>
            <Text style={[styles.cell, styles.headerCell]}>Custo Total</Text>
          </View>
          {funcionarios.map((f, i) => (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, { flex: 2 }]}>{f.nome}</Text>
              <Text style={styles.cell}>{f.funcao}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.salarioBase)}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.liquido)}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.totalEncargos)}</Text>
              <Text style={styles.cell}>{formatCurrencyBRL(f.custoEmpresa)}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
