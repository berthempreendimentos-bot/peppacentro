"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  medicaoSchema,
  medicaoStatusOptions,
  type MedicaoInput,
} from "@/lib/validations/medicoes"
import { useCreateMedicao, useUpdateMedicao, type Medicao } from "@/lib/queries/medicoes"
import { useFuncionarios } from "@/lib/queries/funcionarios"
import { useContrato } from "@/lib/queries/contratos"
import { somarTotais } from "@/lib/calculo-folha"
import { useTributos } from "@/hooks/use-tributos"
import { calcularResumoMedicao } from "@/lib/calculo-medicao"
import { formatCurrencyBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const emptyValues: MedicaoInput = {
  numero: 1,
  competencia: new Date().toISOString().slice(0, 7) + "-01",
  valor: 0,
  percentual_executado: 0,
  data: "",
  status: "pendente",
  mao_de_obra: 0,
  vale_transporte: 0,
  vale_refeicao: 0,
  material: 0,
}

function LinhaResumo({
  label,
  valor,
  destaque,
}: {
  label: string
  valor: number
  destaque?: boolean
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${destaque ? "font-semibold" : ""}`}>
      <span className={destaque ? "" : "text-muted-foreground"}>{label}</span>
      <span>{formatCurrencyBRL(valor)}</span>
    </div>
  )
}

export function MedicaoFormDialog({
  trigger,
  contratoId,
  medicao,
  proximoNumero,
}: {
  trigger: React.ReactNode
  contratoId: string
  medicao?: Medicao
  proximoNumero?: number
}) {
  const [open, setOpen] = useState(false)
  const createMedicao = useCreateMedicao(contratoId)
  const updateMedicao = useUpdateMedicao(contratoId)
  const { data: funcionarios } = useFuncionarios(contratoId)
  const { data: contrato } = useContrato(contratoId)
  const { taxas } = useTributos()
  const isEditing = !!medicao

  // Em uma medição nova, Mão de Obra/VT/VR vêm ao vivo da Folha de Pagamento
  // (aba Funcionários), já com as taxas de FGTS/INSS Patronal/RAT/Terceiros
  // configuradas em "Tributos". Ao editar uma medição existente, mantém os
  // valores gravados na época, para não reescrever a fatura de um mês
  // passado se a folha ou as taxas mudarem depois.
  const totaisFolha = somarTotais(funcionarios ?? [], taxas)
  const maoDeObraAtual = totaisFolha.custoEmpresa - totaisFolha.vtInformado - totaisFolha.vrInformado
  const vtAtual = totaisFolha.vtInformado
  const vrAtual = totaisFolha.vrInformado

  const maoDeObra = isEditing ? medicao.mao_de_obra : maoDeObraAtual
  const valeTransporte = isEditing ? medicao.vale_transporte : vtAtual
  const valeRefeicao = isEditing ? medicao.vale_refeicao : vrAtual

  const form = useForm<MedicaoInput>({
    resolver: zodResolver(medicaoSchema),
    defaultValues: emptyValues,
  })

  const material = form.watch("material")

  const resumo = calcularResumoMedicao({
    maoDeObra,
    valeTransporte,
    valeRefeicao,
    material: material || 0,
    issAliquota: contrato?.iss_aliquota ?? 5,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        medicao
          ? {
              numero: medicao.numero,
              competencia: medicao.competencia,
              valor: medicao.valor,
              percentual_executado: medicao.percentual_executado,
              data: medicao.data ?? "",
              status: medicao.status,
              mao_de_obra: medicao.mao_de_obra,
              vale_transporte: medicao.vale_transporte,
              vale_refeicao: medicao.vale_refeicao,
              material: medicao.material,
            }
          : {
              ...emptyValues,
              numero: proximoNumero ?? 1,
              mao_de_obra: maoDeObraAtual,
              vale_transporte: vtAtual,
              vale_refeicao: vrAtual,
            }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, medicao, proximoNumero])

  useEffect(() => {
    form.setValue("mao_de_obra", maoDeObra)
    form.setValue("vale_transporte", valeTransporte)
    form.setValue("vale_refeicao", valeRefeicao)
    form.setValue("valor", resumo.valorAFaturar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maoDeObra, valeTransporte, valeRefeicao, resumo.valorAFaturar])

  async function onSubmit(values: MedicaoInput) {
    try {
      if (isEditing) {
        await updateMedicao.mutateAsync({ id: medicao.id, input: values })
        toast.success("Medição atualizada")
      } else {
        await createMedicao.mutateAsync(values)
        toast.success("Medição cadastrada")
      }
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar")
    }
  }

  const isSubmitting = createMedicao.isPending || updateMedicao.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar medição" : "Nova medição"}</DialogTitle>
          <DialogDescription>
            Medições aprovadas ou pagas geram automaticamente um lançamento financeiro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-3 text-sm font-semibold">Resumo da medição</p>
              <div className="flex flex-col gap-1.5">
                <LinhaResumo
                  label={isEditing ? "Mão de obra (gravado)" : "Mão de obra (Folha de Pagamento)"}
                  valor={maoDeObra}
                />
                <LinhaResumo
                  label={isEditing ? "Vale Transporte (gravado)" : "Vale Transporte (Folha de Pagamento)"}
                  valor={valeTransporte}
                />
                <LinhaResumo
                  label={isEditing ? "Vale Refeição (gravado)" : "Vale Refeição (Folha de Pagamento)"}
                  valor={valeRefeicao}
                />
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <FormLabel className="text-sm text-muted-foreground">Material</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 w-32 text-right"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Separator className="my-1" />
                <LinhaResumo label="Valor a Faturar" valor={resumo.valorAFaturar} destaque />
                <Separator className="my-1" />
                <LinhaResumo label="Retenção INSS (11%)" valor={resumo.retencaoInss} />
                <LinhaResumo label="IRRF (1,20%)" valor={resumo.irrf} />
                <LinhaResumo label="PIS (0,65%)" valor={resumo.pis} />
                <LinhaResumo label="COFINS (3%)" valor={resumo.cofins} />
                <LinhaResumo label="CSLL (1%)" valor={resumo.csll} />
                <LinhaResumo
                  label={`ISS (${(contrato?.iss_aliquota ?? 5).toString().replace(".", ",")}%)`}
                  valor={resumo.iss}
                />
                <Separator className="my-1" />
                <LinhaResumo label="Retenção total" valor={resumo.retencaoTotal} destaque />
                <LinhaResumo label="Valor líquido" valor={resumo.valorLiquido} destaque />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} value={field.value?.slice(0, 7)} onChange={(e) => field.onChange(`${e.target.value}-01`)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor a Faturar</FormLabel>
                    <FormControl>
                      <Input type="text" readOnly disabled value={formatCurrencyBRL(field.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="percentual_executado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>% executado</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {medicaoStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
