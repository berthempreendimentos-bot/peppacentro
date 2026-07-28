"use client"

import { useState } from "react"
import { Percent } from "lucide-react"
import { toast } from "sonner"

import { useUpdateInssEmMassa } from "@/lib/queries/funcionarios"
import { getErrorMessage } from "@/lib/utils"
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

export function AlterarInssDialog({
  contratoId,
  trigger,
}: {
  contratoId: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [inssPercentual, setInssPercentual] = useState(11)
  const atualizarInss = useUpdateInssEmMassa(contratoId)

  async function handleConfirmar() {
    try {
      await atualizarInss.mutateAsync(inssPercentual)
      toast.success("INSS Empregado atualizado para todos os funcionários deste contrato")
      setOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o INSS Empregado"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar INSS Empregado em massa</DialogTitle>
          <DialogDescription>
            Aplica o mesmo percentual de INSS Empregado a todos os funcionários deste
            contrato.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>INSS Empregado (%)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={inssPercentual}
            onChange={(e) => setInssPercentual(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleConfirmar} disabled={atualizarInss.isPending}>
            <Percent className="size-4" />
            {atualizarInss.isPending ? "Aplicando..." : "Aplicar a todos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
