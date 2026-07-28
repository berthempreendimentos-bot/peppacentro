import { useState, useEffect } from "react"
import { TAXA_FGTS, TAXA_INSS_PATRONAL, TAXA_RAT, TAXA_TERCEIROS } from "@/lib/calculo-folha"

export type TaxasTributos = {
  fgts: number
  inssPatronal: number
  rat: number
  terceiros: number
}

const DEFAULT_TAXAS: TaxasTributos = {
  fgts: TAXA_FGTS,
  inssPatronal: TAXA_INSS_PATRONAL,
  rat: TAXA_RAT,
  terceiros: TAXA_TERCEIROS,
}

export function useTributos() {
  const [taxas, setTaxas] = useState<TaxasTributos>(DEFAULT_TAXAS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("configTributos")
    if (saved) {
      try {
        setTaxas(JSON.parse(saved))
      } catch (e) {
        console.error("Erro ao ler tributos salvos", e)
      }
    }
    setIsLoaded(true)
  }, [])

  const saveTaxas = (novasTaxas: TaxasTributos) => {
    setTaxas(novasTaxas)
    localStorage.setItem("configTributos", JSON.stringify(novasTaxas))
  }

  const resetTaxas = () => {
    setTaxas(DEFAULT_TAXAS)
    localStorage.removeItem("configTributos")
  }

  return { taxas, saveTaxas, resetTaxas, isLoaded, defaultTaxas: DEFAULT_TAXAS }
}
