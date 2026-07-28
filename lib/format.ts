export function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function formatCpfCnpj(value: string | null | undefined) {
  if (!value) return ""
  const digits = onlyDigits(value)
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }
  return value
}

export function formatCurrencyBRL(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value))
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function formatDateShort(value: string | null | undefined) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function formatMesAno(date: Date = new Date()) {
  const texto = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function contentDispositionAnexo(nomeArquivo: string): string {
  const semAcento = nomeArquivo.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
  const asciiSeguro = semAcento.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "")
  const codificado = encodeURIComponent(nomeArquivo)
  return `attachment; filename="${asciiSeguro}"; filename*=UTF-8''${codificado}`
}
