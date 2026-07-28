"use client"

import { useState } from "react"
import { Settings2 } from "lucide-react"

import { useTributos } from "@/hooks/use-tributos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ConfiguracaoTributosDialog() {
  const { taxas, saveTaxas, resetTaxas, defaultTaxas } = useTributos()
  const [open, setOpen] = useState(false)

  // O estado local é útil para o formulário antes de salvar
  const [localTaxas, setLocalTaxas] = useState(taxas)

  // Sincroniza quando abrir
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) setLocalTaxas(taxas)
    setOpen(newOpen)
  }

  const handleSave = () => {
    saveTaxas(localTaxas)
    toast.success("Configurações de tributos salvas com sucesso (local).")
    setOpen(false)
  }

  const handleReset = () => {
    setLocalTaxas(defaultTaxas)
    resetTaxas()
    toast.info("Configurações restauradas para o padrão.")
    setOpen(false)
  }

  const handleChange = (key: keyof typeof taxas, value: string) => {
    // Converte de "8" para "0.08"
    const percentual = (parseFloat(value) || 0) / 100
    setLocalTaxas((prev) => ({ ...prev, [key]: percentual }))
  }

  // Helper para exibir de "0.08" para "8"
  const toDisplay = (val: number) => (val * 100).toFixed(2).replace(/\.00$/, "")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" title="Configurar Tributos">
          <Settings2 className="mr-2 h-4 w-4" /> Tributos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuração de Tributos</DialogTitle>
          <DialogDescription>
            Altere as porcentagens usadas no cálculo da folha. Estes valores ficarão salvos no seu navegador atual.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fgts" className="text-right">
              FGTS (%)
            </Label>
            <Input
              id="fgts"
              type="number"
              step="0.01"
              value={toDisplay(localTaxas.fgts)}
              onChange={(e) => handleChange("fgts", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inssPatronal" className="text-right">
              INSS Patronal (%)
            </Label>
            <Input
              id="inssPatronal"
              type="number"
              step="0.01"
              value={toDisplay(localTaxas.inssPatronal)}
              onChange={(e) => handleChange("inssPatronal", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rat" className="text-right">
              RAT (%)
            </Label>
            <Input
              id="rat"
              type="number"
              step="0.01"
              value={toDisplay(localTaxas.rat)}
              onChange={(e) => handleChange("rat", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="terceiros" className="text-right">
              Terceiros (%)
            </Label>
            <Input
              id="terceiros"
              type="number"
              step="0.01"
              value={toDisplay(localTaxas.terceiros)}
              onChange={(e) => handleChange("terceiros", e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleReset}>
            Restaurar Padrão
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
