import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

import { formatCurrencyBRL, formatDate } from "@/lib/format"

const COR_BORDA = "#1a1b22"
const COR_FAIXA = "#1a1b22"
const COR_FAIXA_TEXTO = "#ffffff"

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8.5, fontFamily: "Helvetica", color: "#1a1b22" },
  tituloBox: {
    borderWidth: 1,
    borderColor: COR_BORDA,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  tituloTexto: { fontSize: 13, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  subtituloTexto: { fontSize: 9, color: "#555555", marginTop: 2 },
  
  infoBox: {
    borderWidth: 1,
    borderColor: COR_BORDA,
    marginBottom: 14,
  },
  infoHeader: {
    backgroundColor: COR_FAIXA,
    color: COR_FAIXA_TEXTO,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingVertical: 4,
  },
  infoLinha: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: COR_BORDA },
  infoLabel: { fontFamily: "Helvetica-Bold", width: 120 },
  infoValor: { flex: 1 },

  tabelaBox: {
    borderWidth: 1,
    borderColor: COR_BORDA,
    marginTop: 10,
  },
  tabelaHeaderRow: { flexDirection: "row", backgroundColor: COR_FAIXA },
  tabelaHeaderCell: {
    color: COR_FAIXA_TEXTO,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "left",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: "#ffffff33",
    flex: 1,
  },
  tabelaHeaderCellRight: {
    color: COR_FAIXA_TEXTO,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "right",
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 120,
  },
  linha: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COR_BORDA },
  linhaPar: { backgroundColor: "#f7f6fb" },
  celulaLabel: { flex: 1, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: COR_BORDA },
  celulaValor: { width: 120, paddingHorizontal: 8, paddingVertical: 6, textAlign: "right" },
  
  linhaDestaque: {
    flexDirection: "row",
    backgroundColor: "#ffd700",
  },
  celulaLabelDestaque: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderRightColor: COR_BORDA,
  },
  celulaValorDestaque: {
    width: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  
  rodape: { marginTop: 20, fontSize: 7, color: "#777777", textAlign: "center" },
})

export function ResumoFinanceiroPdfDocument({
  mesReferencia,
  valorMedicao,
  valorRetencao,
  valorLiquido,
  totalGastos,
  pagamentoContrato,
  nomesContratos,
  gastos,
}: {
  mesReferencia: string
  valorMedicao: number
  valorRetencao: number
  valorLiquido: number
  totalGastos: number
  pagamentoContrato: number
  nomesContratos: { texto: string; negativo: boolean }[]
  gastos: { data: string; descricao: string; valor: number; classificacao?: string; nomeContrato?: string }[]
}) {
  const gastosMensal = gastos.filter(g => g.classificacao === 'mensal').reduce((acc, g) => acc + g.valor, 0)
  const gastosRecorrente = gastos.filter(g => g.classificacao === 'recorrente').reduce((acc, g) => acc + g.valor, 0)
  const gastosIntegracao = gastos.filter(g => g.classificacao === 'integracao').reduce((acc, g) => acc + g.valor, 0)
  const gastosVinculada = gastos.filter(g => g.classificacao === 'vinculada').reduce((acc, g) => acc + g.valor, 0)
  const gastosNormal = gastos.filter(g => !g.classificacao || g.classificacao === 'normal').reduce((acc, g) => acc + g.valor, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.tituloBox}>
          <Text style={styles.tituloTexto}>RESUMO FINANCEIRO</Text>
          <Text style={styles.subtituloTexto}>Relatório Consolidado</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoHeader}>INFORMAÇÕES DO RELATÓRIO</Text>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Mês de Referência:</Text>
            <Text style={styles.infoValor}>{mesReferencia}</Text>
          </View>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Contratos Selecionados:</Text>
            <View style={styles.infoValor}>
              {nomesContratos.map((c, i) => (
                <Text key={i} style={{ marginBottom: 2, color: c.negativo ? "#ef4444" : undefined }}>{c.texto}</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.tabelaBox}>
          <View style={styles.tabelaHeaderRow}>
            <Text style={styles.tabelaHeaderCell}>DESCRIÇÃO</Text>
            <Text style={styles.tabelaHeaderCellRight}>VALOR TOTAL</Text>
          </View>

          <View style={styles.linha}>
            <Text style={styles.celulaLabel}>Valor Total das Medições</Text>
            <Text style={styles.celulaValor}>{formatCurrencyBRL(valorMedicao)}</Text>
          </View>

          <View style={[styles.linha, styles.linhaPar]}>
            <Text style={styles.celulaLabel}>Valor da Retenção</Text>
            <Text style={styles.celulaValor}>{formatCurrencyBRL(valorRetencao)}</Text>
          </View>

          <View style={styles.linhaDestaque}>
            <Text style={styles.celulaLabelDestaque}>Valor Líquido das Medições</Text>
            <Text style={styles.celulaValorDestaque}>{formatCurrencyBRL(valorLiquido)}</Text>
          </View>
        </View>

        <View style={styles.tabelaBox}>
          <View style={styles.tabelaHeaderRow}>
            <Text style={styles.tabelaHeaderCell}>GASTOS E PAGAMENTOS</Text>
            <Text style={styles.tabelaHeaderCellRight}>VALOR TOTAL</Text>
          </View>

          <View style={styles.linha}>
            <Text style={styles.celulaLabel}>Total de Gastos (Despesas / Custos)</Text>
            <Text style={styles.celulaValor}>{formatCurrencyBRL(totalGastos)}</Text>
          </View>

          <View style={[styles.linha, styles.linhaPar]}>
            <Text style={styles.celulaLabel}>Total Recebido (Pagamentos do Contrato)</Text>
            <Text style={styles.celulaValor}>{formatCurrencyBRL(pagamentoContrato)}</Text>
          </View>

          <View style={[styles.linha, { backgroundColor: "#ffedd5" }]}>
            <Text style={styles.celulaLabel}>Total Vinculado</Text>
            <Text style={styles.celulaValor}>{formatCurrencyBRL(gastosVinculada)}</Text>
          </View>
          
          <View style={[styles.linhaDestaque, { borderBottomWidth: 0, backgroundColor: pagamentoContrato - totalGastos >= 0 ? "#dcfce7" : "#ffe4e6" }]}>
            <Text style={styles.celulaLabelDestaque}>Resultado (Recebimentos - Gastos)</Text>
            <Text style={styles.celulaValorDestaque}>{formatCurrencyBRL(pagamentoContrato - totalGastos)}</Text>
          </View>
        </View>

        <Text style={styles.rodape}>Gerado em {formatDate(new Date().toISOString())}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.tituloBox}>
          <Text style={styles.tituloTexto}>RELATÓRIO DE GASTOS</Text>
          <Text style={styles.subtituloTexto}>Detalhamento das Despesas e Custos</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoHeader}>INFORMAÇÕES DO RELATÓRIO</Text>
          <View style={styles.infoLinha}>
            <Text style={styles.infoLabel}>Mês de Referência:</Text>
            <Text style={styles.infoValor}>{mesReferencia}</Text>
          </View>
        </View>

        <View style={styles.tabelaBox}>
          <View style={styles.tabelaHeaderRow}>
            <Text style={[styles.tabelaHeaderCell, { flex: 0.5 }]}>DATA</Text>
            <Text style={[styles.tabelaHeaderCell, { flex: 2 }]}>DESCRIÇÃO</Text>
            <Text style={styles.tabelaHeaderCellRight}>VALOR</Text>
          </View>

          {gastos.length === 0 ? (
            <View style={styles.linha}>
              <Text style={[styles.celulaLabel, { flex: 1, textAlign: "center", borderRightWidth: 0, paddingVertical: 12, color: "#777777" }]}>Nenhum gasto registrado neste mês.</Text>
            </View>
          ) : null}

          {gastos.slice().sort((a, b) => {
            const classA = a.classificacao || "normal";
            const classB = b.classificacao || "normal";
            if (classA !== classB) return classA.localeCompare(classB);
            return (a.data || "").localeCompare(b.data || "");
          }).map((g, i) => (
            <View key={i} style={[styles.linha, i % 2 !== 0 ? styles.linhaPar : {}]}>
              <Text style={[styles.celulaLabel, { flex: 0.5 }]}>{g.data ? formatDate(g.data) : ""}</Text>
              <Text style={[styles.celulaLabel, { flex: 2 }]}>
                <Text>{g.descricao || ""}</Text>
                {g.classificacao && g.classificacao !== "normal" ? (
                  <Text style={{ fontFamily: "Helvetica-Bold" }}> {`[${g.classificacao.toUpperCase()}]`}</Text>
                ) : null}
                {g.nomeContrato ? (
                  <Text style={{ fontSize: 6, color: "#666666" }}>  ({g.nomeContrato})</Text>
                ) : null}
              </Text>
              <Text style={styles.celulaValor}>{formatCurrencyBRL(g.valor || 0)}</Text>
            </View>
          ))}
          
          {gastos.length > 0 ? (
            <View style={styles.linhaDestaque}>
              <Text style={styles.celulaLabelDestaque}>TOTAL DE GASTOS</Text>
              <Text style={styles.celulaValorDestaque}>{formatCurrencyBRL(totalGastos)}</Text>
            </View>
          ) : null}
        </View>

        {gastos.length > 0 && (
          <View style={[styles.tabelaBox, { marginTop: 20 }]}>
            <View style={styles.tabelaHeaderRow}>
              <Text style={styles.tabelaHeaderCell}>RESUMO POR TIPO DE GASTO</Text>
              <Text style={styles.tabelaHeaderCellRight}>SUBTOTAL</Text>
            </View>
            {gastosNormal > 0 && (
              <View style={styles.linha}>
                <Text style={styles.celulaLabel}>Normal</Text>
                <Text style={styles.celulaValor}>{formatCurrencyBRL(gastosNormal)}</Text>
              </View>
            )}
            {gastosMensal > 0 && (
              <View style={styles.linha}>
                <Text style={styles.celulaLabel}>Mensal</Text>
                <Text style={styles.celulaValor}>{formatCurrencyBRL(gastosMensal)}</Text>
              </View>
            )}
            {gastosRecorrente > 0 && (
              <View style={styles.linha}>
                <Text style={styles.celulaLabel}>Recorrente</Text>
                <Text style={styles.celulaValor}>{formatCurrencyBRL(gastosRecorrente)}</Text>
              </View>
            )}
            {gastosIntegracao > 0 && (
              <View style={styles.linha}>
                <Text style={styles.celulaLabel}>Integração</Text>
                <Text style={styles.celulaValor}>{formatCurrencyBRL(gastosIntegracao)}</Text>
              </View>
            )}
            {gastosVinculada > 0 && (
              <View style={styles.linha}>
                <Text style={styles.celulaLabel}>Vinculada</Text>
                <Text style={styles.celulaValor}>{formatCurrencyBRL(gastosVinculada)}</Text>
              </View>
            )}
          </View>
        )}


        <Text style={styles.rodape}>Gerado em {formatDate(new Date().toISOString())}</Text>
      </Page>
    </Document>
  )
}
