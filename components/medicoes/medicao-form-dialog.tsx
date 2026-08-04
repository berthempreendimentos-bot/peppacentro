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
import {
  useCreateMedicao,
  useUpdateMedicao,
  useFecharFolhaMedicao,
  type Medicao,
} from "@/lib/queries/medicoes"
import { useFuncionarios } from "@/lib/queries/funcionarios"
import { useContrato } from "@/lib/queries/contratos"
import { calcularDuracaoContrato } from "@/lib/contrato-duracao"
import { calcularContaDepositoVinculada, somarTotais } from "@/lib/calculo-folha"
import { useTributos, taxasParaQueryString } from "@/hooks/use-tributos"
import { calcularResumoMedicao } from "@/lib/calculo-medicao"
import { formatCurrencyBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
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
  valor_contrato: 0,
  liquido_empregados: 0,
  fgts: 0,
  valor_vinculado: 0,
  valor_liquido: 0,
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
  onCreated,
}: {
  trigger: React.ReactNode
  contratoId: string
  medicao?: Medicao
  proximoNumero?: number
  onCreated?: (medicao: Medicao) => void
}) {
  const [open, setOpen] = useState(false)
  const createMedicao = useCreateMedicao(contratoId)
  const updateMedicao = useUpdateMedicao(contratoId)
  const fecharFolha = useFecharFolhaMedicao(contratoId)
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

  const valeTransporte = isEditing ? medicao.vale_transporte : vtAtual
  const valeRefeicao = isEditing ? medicao.vale_refeicao : vrAtual

  // Valor do Contrato no resumo é o valor MENSAL estimado (valor_atual do
  // contrato dividido pela duração em meses), não o valor total — e não é
  // editável aqui, é sempre calculado a partir do cadastro do contrato.
  const duracaoContrato = calcularDuracaoContrato(
    contrato?.data_inicio ?? null,
    contrato?.data_fim ?? null
  )
  const valorContratoMensalAtual = contrato ? contrato.valor_atual / duracaoContrato.total : 0
  const valorContrato = isEditing ? medicao.valor_contrato : valorContratoMensalAtual

  // Líquido dos empregados, FGTS e valor vinculado (Conta-Depósito Vinculada)
  // são gravados na medição para poder lançar em Contas a Pagar depois, sem
  // depender da folha atual no momento do lançamento.
  const contaVinculadaAtual = calcularContaDepositoVinculada(totaisFolha.remuneracaoTotal).totalRetencaoMensal
  const liquidoEmpregados = isEditing ? medicao.liquido_empregados : totaisFolha.liquido
  const fgts = isEditing ? medicao.fgts : totaisFolha.fgts
  const valorVinculado = isEditing ? medicao.valor_vinculado : contaVinculadaAtual

  const form = useForm<MedicaoInput>({
    resolver: zodResolver(medicaoSchema),
    defaultValues: emptyValues,
  })

  const valorFaturar = form.watch("valor") || 0
  const material = form.watch("material")
  const formValeTransporte = form.watch("vale_transporte") || 0
  const formValeRefeicao = form.watch("vale_refeicao") || 0
  const maoDeObraCalculada = Math.max(0, valorFaturar - formValeTransporte - formValeRefeicao - (material || 0))

  const resumo = calcularResumoMedicao({
    maoDeObra: maoDeObraCalculada,
    valeTransporte: formValeTransporte,
    valeRefeicao: formValeRefeicao,
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
              valor_contrato: medicao.valor_contrato,
              liquido_empregados: medicao.liquido_empregados,
              fgts: medicao.fgts,
              valor_vinculado: medicao.valor_vinculado,
              valor_liquido: medicao.valor_liquido,
            }
          : {
              ...emptyValues,
              numero: proximoNumero ?? 1,
              mao_de_obra: maoDeObraAtual,
              vale_transporte: vtAtual,
              vale_refeicao: vrAtual,
              valor_contrato: valorContratoMensalAtual,
              liquido_empregados: totaisFolha.liquido,
              fgts: totaisFolha.fgts,
              valor_vinculado: contaVinculadaAtual,
            }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, medicao, proximoNumero])

  useEffect(() => {
    form.setValue("mao_de_obra", maoDeObraCalculada)
    form.setValue("liquido_empregados", liquidoEmpregados)
    form.setValue("fgts", fgts)
    form.setValue("valor_vinculado", valorVinculado)
    form.setValue("valor_liquido", resumo.valorLiquido)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    maoDeObraCalculada,
    resumo.valorLiquido,
    liquidoEmpregados,
    fgts,
    valorVinculado,
  ])

  async function fecharFolhaSeNecessario(medicaoId: string) {
    try {
      await fecharFolha.mutateAsync({ medicaoId, taxasQuery: taxasParaQueryString(taxas) })
      toast.success("Folha de Pagamento do mês salva para download")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar a folha de pagamento"
      )
    }
  }

  async function onSubmit(values: MedicaoInput) {
    const estaFechando = values.status === "aprovada" || values.status === "paga"
    try {
      if (isEditing) {
        const atualizada = await updateMedicao.mutateAsync({ id: medicao.id, input: values })
        toast.success("Medição atualizada")
        // Só salva a folha na primeira vez que a medição é fechada, para não
        // gerar um snapshot novo a cada edição de uma medição já aprovada/paga.
        if (estaFechando && !medicao.folha_documento_id && atualizada) {
          await fecharFolhaSeNecessario(atualizada.id)
        }
      } else {
        const criada = await createMedicao.mutateAsync(values)
        toast.success("Medição cadastrada")
        if (criada) {
          onCreated?.(criada)
          if (estaFechando) await fecharFolhaSeNecessario(criada.id)
        }
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
                <FormField
                  control={form.control}
                  name="valor_contrato"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <FormLabel className="text-sm font-semibold">
                        {`Valor do Contrato (mensal${duracaoContrato.estimado ? ", estimado" : ""})`}
                      </FormLabel>
                      <FormControl>
                        <CurrencyInput
                          className="h-7 w-36 text-right font-semibold"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Separator className="my-1" />
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <FormLabel className="text-sm font-semibold">Valor a Faturar</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          className="h-7 w-36 text-right font-semibold"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <LinhaResumo
                  label="Mão de obra (calculado)"
                  valor={maoDeObraCalculada}
                />
                <FormField
                  control={form.control}
                  name="vale_transporte"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <FormLabel className="text-sm text-muted-foreground">
                        {isEditing ? "Vale Transporte (gravado)" : "Vale Transporte (Folha de Pagamento)"}
                      </FormLabel>
                      <FormControl>
                        <CurrencyInput
                          className="h-7 w-36 text-right"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vale_refeicao"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <FormLabel className="text-sm text-muted-foreground">
                        {isEditing ? "Vale Refeição (gravado)" : "Vale Refeição (Folha de Pagamento)"}
                      </FormLabel>
                      <FormControl>
                        <CurrencyInput
                          className="h-7 w-36 text-right"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                      <FormLabel className="text-sm text-muted-foreground">Material</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          className="h-7 w-36 text-right"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Separator className="my-1" />
                <LinhaResumo label="Retenção INSS (11%)" valor={resumo.retencaoInss} />
                <LinhaResumo label={`IRRF (${(resumo.taxaIrrfAplicada * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%)`} valor={resumo.irrf} />
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
