import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

import { formatCpfCnpj, formatCurrencyBRL, formatDate } from "@/lib/format"
import { valorPorExtenso } from "@/lib/numero-por-extenso"

const COR_BORDA = "#1a1b22"
const COR_FAIXA = "#1a1b22"
const COR_FAIXA_TEXTO = "#ffffff"
const COR_DESTAQUE = "#ffd700"
const COR_LINHA_PAR = "#f7f6fb"

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
  linhaTopo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  destinatarioBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COR_BORDA,
  },
  destinatarioHeader: {
    backgroundColor: COR_FAIXA,
    color: COR_FAIXA_TEXTO,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingVertical: 3,
  },
  destinatarioLinha: { flexDirection: "row", paddingHorizontal: 6, paddingVertical: 2 },
  destinatarioLabel: { fontFamily: "Helvetica-Bold", width: 90 },
  inicioBox: {
    borderWidth: 1,
    borderColor: COR_BORDA,
    marginLeft: 10,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  inicioLabel: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  extensoBox: {
    borderWidth: 1,
    borderColor: COR_BORDA,
    flexDirection: "row",
    marginBottom: 10,
  },
  extensoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: COR_BORDA,
  },
  extensoTexto: { fontSize: 8.5, paddingHorizontal: 8, paddingVertical: 5, flex: 1, textTransform: "capitalize" },
  tabelaBox: { borderWidth: 1, borderColor: COR_BORDA },
  tabelaHeaderRow: { flexDirection: "row", backgroundColor: COR_FAIXA },
  tabelaHeaderCell: {
    color: COR_FAIXA_TEXTO,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: "#ffffff33",
  },
  objetoRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COR_BORDA },
  colUnidade: { width: 42, textAlign: "center", paddingVertical: 6, borderRightWidth: 1, borderRightColor: COR_BORDA },
  colQuantidade: { width: 52, textAlign: "center", paddingVertical: 6, borderRightWidth: 1, borderRightColor: COR_BORDA },
  colObjeto: { flex: 1, paddingHorizontal: 8, paddingVertical: 6, borderRightWidth: 1, borderRightColor: COR_BORDA, textAlign: "justify" },
  colPreco: { width: 72, textAlign: "center", paddingVertical: 6, borderRightWidth: 1, borderRightColor: COR_BORDA },
  colValor: { width: 72, textAlign: "center", paddingVertical: 6 },
  destaqueRow: {
    borderBottomWidth: 1,
    borderBottomColor: COR_BORDA,
    backgroundColor: COR_DESTAQUE,
    paddingVertical: 5,
    alignItems: "center",
  },
  destaqueTexto: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  breakdownRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COR_BORDA },
  breakdownEsquerda: { flex: 1, borderRightWidth: 1, borderRightColor: COR_BORDA },
  breakdownLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  breakdownLinhaPar: { backgroundColor: COR_LINHA_PAR },
  breakdownLabel: { fontSize: 8 },
  breakdownValor: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  breakdownDireita: { width: 186 },
  finalLinha: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COR_BORDA,
    alignItems: "stretch",
  },
  finalLabel: { flex: 1, fontSize: 8, paddingHorizontal: 8, paddingVertical: 5, justifyContent: "center" },
  finalValorCol: {
    width: 186,
    flexDirection: "row",
  },
  finalValorLabel: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: COR_BORDA,
    justifyContent: "center",
  },
  finalValorNumero: {
    width: 92,
    fontSize: 8.5,
    textAlign: "center",
    paddingVertical: 5,
    justifyContent: "center",
  },
  rodape: { marginTop: 14, fontSize: 7, color: "#777777", textAlign: "center" },
})

export function EspelhoMedicaoPdfDocument({
  clienteNome,
  clienteEndereco,
  clientePracaPagamento,
  clienteCpfCnpj,
  contratoNumero,
  objetoContrato,
  dataInicioContrato,
  periodoInicio,
  periodoFim,
  numeroMedicao,
  valorContrato,
  maoDeObra,
  valeTransporte,
  valeRefeicao,
  material,
  valorAFaturar,
  retencaoInss,
  irrf,
  pis,
  cofins,
  csll,
  issAliquota,
  iss,
  retencaoTotal,
  valorLiquido,
}: {
  clienteNome: string
  clienteEndereco: string | null
  clientePracaPagamento: string | null
  clienteCpfCnpj: string | null
  contratoNumero: string
  objetoContrato: string
  dataInicioContrato: string | null
  periodoInicio: string
  periodoFim: string
  numeroMedicao: number
  valorContrato: number
  maoDeObra: number
  valeTransporte: number
  valeRefeicao: number
  material: number
  valorAFaturar: number
  retencaoInss: number
  irrf: number
  pis: number
  cofins: number
  csll: number
  issAliquota: number
  iss: number
  retencaoTotal: number
  valorLiquido: number
}) {
  const objetoCompleto =
    `OBJETO: ${objetoContrato} Conforme Contrato nº ${contratoNumero}, referente ao período de ${periodoInicio} a ${periodoFim}. ` +
    `Alimentação (Vale Refeição) aplicado: ${formatCurrencyBRL(valeRefeicao)}. Vale Transporte: ${formatCurrencyBRL(valeTransporte)}. ` +
    `Base de cálculo para retenção do INSS: ${formatCurrencyBRL(maoDeObra)} × 11% = ${formatCurrencyBRL(retencaoInss)}.`

  const breakdown: [string, number][] = [
    ["MÃO DE OBRA", maoDeObra],
    ["VALE TRANSPORTE", valeTransporte],
    ["VALE REFEIÇÃO", valeRefeicao],
    ["MATERIAL", material],
    ["RETENÇÃO INSS (11%)", retencaoInss],
    ["IRRF (1,20%)", irrf],
    ["PIS (0,65%)", pis],
    ["COFINS (3%)", cofins],
    ["CSLL (1,00%)", csll],
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.tituloBox}>
          <Text style={styles.tituloTexto}>{clienteNome}</Text>
          <Text style={styles.subtituloTexto}>Espelho de Medição nº {numeroMedicao}</Text>
        </View>

        <View style={styles.linhaTopo}>
          <View style={styles.destinatarioBox}>
            <Text style={styles.destinatarioHeader}>DESTINATÁRIO</Text>
            <View style={styles.destinatarioLinha}>
              <Text style={styles.destinatarioLabel}>Nome da Firma:</Text>
              <Text>{clienteNome}</Text>
            </View>
            <View style={styles.destinatarioLinha}>
              <Text style={styles.destinatarioLabel}>Endereço:</Text>
              <Text>{clienteEndereco || "—"}</Text>
            </View>
            <View style={styles.destinatarioLinha}>
              <Text style={styles.destinatarioLabel}>Praça de Pagamento:</Text>
              <Text>{clientePracaPagamento || "—"}</Text>
            </View>
            <View style={styles.destinatarioLinha}>
              <Text style={styles.destinatarioLabel}>CNPJ/CPF:</Text>
              <Text>{formatCpfCnpj(clienteCpfCnpj) || "—"}</Text>
            </View>
          </View>
          <View style={styles.inicioBox}>
            <Text style={styles.inicioLabel}>INÍCIO: {formatDate(dataInicioContrato)}</Text>
          </View>
        </View>

        <View style={styles.extensoBox}>
          <Text style={styles.extensoLabel}>VALOR POR EXTENSO</Text>
          <Text style={styles.extensoTexto}>{valorPorExtenso(valorAFaturar)}</Text>
        </View>

        <View style={styles.tabelaBox}>
          <View style={styles.tabelaHeaderRow}>
            <Text style={[styles.tabelaHeaderCell, { width: 42 }]}>UNIDADE</Text>
            <Text style={[styles.tabelaHeaderCell, { width: 52 }]}>QUANTIDADE</Text>
            <Text style={[styles.tabelaHeaderCell, { flex: 1 }]}>POSTO ADMINISTRAÇÃO</Text>
            <Text style={[styles.tabelaHeaderCell, { width: 72 }]}>PREÇO UNITÁRIO</Text>
            <Text style={[styles.tabelaHeaderCell, { width: 72, borderRightWidth: 0 }]}>VALOR</Text>
          </View>

          <View style={styles.objetoRow}>
            <Text style={styles.colUnidade}>UND</Text>
            <Text style={styles.colQuantidade}>1</Text>
            <Text style={styles.colObjeto}>{objetoCompleto}</Text>
            <Text style={styles.colPreco}>{formatCurrencyBRL(valorAFaturar)}</Text>
            <Text style={styles.colValor}>{formatCurrencyBRL(valorAFaturar)}</Text>
          </View>

          <View style={styles.destaqueRow}>
            <Text style={styles.destaqueTexto}>VALOR DO CONTRATO: {formatCurrencyBRL(valorContrato)}</Text>
          </View>
          <View style={styles.destaqueRow}>
            <Text style={styles.destaqueTexto}>VALOR A FATURAR: {formatCurrencyBRL(valorAFaturar)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownEsquerda}>
              {breakdown.map(([label, valor], i) => (
                <View
                  key={label}
                  style={[styles.breakdownLinha, ...(i % 2 === 1 ? [styles.breakdownLinhaPar] : [])]}
                >
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <Text style={styles.breakdownValor}>{formatCurrencyBRL(valor)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.breakdownDireita} />
          </View>

          <View style={styles.finalLinha}>
            <Text style={styles.finalLabel}>
              VALOR DO ISS {issAliquota.toString().replace(".", ",")}%: {formatCurrencyBRL(iss)}
            </Text>
            <View style={styles.finalValorCol}>
              <Text style={styles.finalValorLabel}>VALOR DOS SERVIÇOS</Text>
              <Text style={styles.finalValorNumero}>{formatCurrencyBRL(valorAFaturar)}</Text>
            </View>
          </View>
          <View style={styles.finalLinha}>
            <Text style={styles.finalLabel} />
            <View style={styles.finalValorCol}>
              <Text style={styles.finalValorLabel}>RETENÇÃO</Text>
              <Text style={styles.finalValorNumero}>{formatCurrencyBRL(retencaoTotal)}</Text>
            </View>
          </View>
          <View style={[styles.finalLinha, { borderBottomWidth: 0 }]}>
            <Text style={styles.finalLabel} />
            <View style={styles.finalValorCol}>
              <Text style={[styles.finalValorLabel, { fontFamily: "Helvetica-Bold" }]}>VALOR TOTAL</Text>
              <Text style={[styles.finalValorNumero, { fontFamily: "Helvetica-Bold" }]}>
                {formatCurrencyBRL(valorLiquido)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.rodape}>Gerado em {formatDate(new Date().toISOString())}</Text>
      </Page>
    </Document>
  )
}
