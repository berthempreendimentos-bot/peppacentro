"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useAddEpi, useAddFerramenta } from "@/lib/queries/postos-servico"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AdicionarItemDialog({
  trigger,
  contratoId,
  postoServicoId,
  tipo,
}: {
  trigger: React.ReactNode
  contratoId: string
  postoServicoId: string
  tipo: "epi" | "ferramenta"
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [quantidade, setQuantidade] = useState(1)
  const [valor, setValor] = useState<number | "">("")
  const addEpi = useAddEpi(contratoId)
  const addFerramenta = useAddFerramenta(contratoId)

  const isPending = addEpi.isPending || addFerramenta.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      toast.error("Informe o nome")
      return
    }
    try {
      if (tipo === "epi") {
        await addEpi.mutateAsync({
          postoServicoId,
          nome,
          quantidade,
          valor: valor === "" ? undefined : valor,
        })
      } else {
        await addFerramenta.mutateAsync({
          postoServicoId,
          nome,
          quantidade,
          valorUnitario: valor === "" ? undefined : valor,
        })
      }
      toast.success(tipo === "epi" ? "EPI adicionado" : "Ferramenta adicionada")
      setNome("")
      setQuantidade(1)
      setValor("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tipo === "epi" ? "Adicionar EPI" : "Adicionar ferramenta"}</DialogTitle>
          <DialogDescription>Vinculado a este posto de serviço.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.valueAsNumber || 1)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Valor {tipo === "ferramenta" ? "unitário" : ""} (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) =>
                  setValor(e.target.value === "" ? "" : e.target.valueAsNumber)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
