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
