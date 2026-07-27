"use client"

import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"

export function CurrencyInput({
  value,
  onChange,
  disabled,
  className,
}: {
  value: number
  onChange: (val: number) => void
  disabled?: boolean
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    setDisplayValue(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    )
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/\D/g, "")
    if (!val) val = "0"
    const num = Number(val) / 100
    setDisplayValue(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
    )
    onChange(num)
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      className={className}
    />
  )
}
