"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Paperclip, X } from "lucide-react"
import { toast } from "sonner"

import {
  lancamentoSchema,
  lancamentoStatusOptions,
  lancamentoTipoOptions,
  type LancamentoInput,
} from "@/lib/validations/lancamentos"
import {
  useCreateLancamento,
  useUpdateLancamento,
  type Lancamento,
} from "@/lib/queries/lancamentos"
import { useCategorias } from "@/lib/queries/centro-custos"
import { useFornecedores } from "@/lib/queries/fornecedores"
import { useCentroCustos } from "@/lib/queries/centro-custos"
import { useContratos } from "@/lib/queries/contratos"
import { useDownloadDocumento } from "@/lib/queries/documentos"
import { useCreateCategoria, useCreateCentroCusto } from "@/lib/queries/centro-custos"
import { useCreateFornecedor } from "@/lib/queries/fornecedores"
import { useDocumentosLancamento, useDeleteDocumentoLancamento } from "@/lib/queries/lancamentos"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
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

function CriarNovoDialog({
  title,
  isOpen,
  onOpenChange,
  onSalvar,
  isPending,
  centrosCusto,
}: {
  title: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSalvar: (nome: string, centroCustoId?: string) => void
  isPending: boolean
  centrosCusto?: { id: string; nome: string }[]
}) {
  const [nome, setNome] = useState("")
  const [centroCustoId, setCentroCustoId] = useState("")

  useEffect(() => {
    if (!isOpen) {
      setNome("")
      setCentroCustoId("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Nome</Label>
            <Input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (nome.trim()) onSalvar(nome.trim(), centroCustoId)
                }
              }}
            />
          </div>
          {centrosCusto && (
            <div className="flex flex-col gap-2">
              <Label>Vincular a um Centro de Custo (Opcional)</Label>
              <Select value={centroCustoId || "none"} onValueChange={(v) => setCentroCustoId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {centrosCusto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (nome.trim()) onSalvar(nome.trim(), centroCustoId)
            }}
            disabled={!nome.trim() || isPending}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const emptyValues: LancamentoInput = {
  tipo: "despesa",
  descricao: "",
  categoria_id: "",
  valor: 0,
  data: new Date().toISOString().slice(0, 10),
  mes_referencia: new Date().toISOString().slice(0, 7),
  fornecedor_id: "",
  centro_custo_id: "",
  status: "pendente",
}

export function LancamentoFormDialog({
  trigger,
  contratoId,
  lancamento,
}: {
  trigger: React.ReactNode
  contratoId?: string
  lancamento?: Lancamento
}) {
  const [open, setOpen] = useState(false)
  const [contratoSelecionado, setContratoSelecionado] = useState("")
  const [notasFiscais, setNotasFiscais] = useState<File[]>([])

  const { data: categorias } = useCategorias()
  const { data: fornecedores } = useFornecedores()
  const { data: centroCustos } = useCentroCustos()
  const { data: contratos } = useContratos()
  const downloadDocumento = useDownloadDocumento()
  const deleteDocumentoLancamento = useDeleteDocumentoLancamento()
  const precisaEscolherContrato = !contratoId
  const contratoEfetivo = contratoId ?? contratoSelecionado
  const createLancamento = useCreateLancamento(contratoEfetivo)
  const updateLancamento = useUpdateLancamento(contratoEfetivo)
  const isEditing = !!lancamento
  const { data: anexos } = useDocumentosLancamento(isEditing ? lancamento.id : undefined)
  const createCategoria = useCreateCategoria()
  const createFornecedor = useCreateFornecedor()
  const createCentroCusto = useCreateCentroCusto()

  const [openNovaCat, setOpenNovaCat] = useState(false)
  const [openNovoForn, setOpenNovoForn] = useState(false)
  const [openNovoCentro, setOpenNovoCentro] = useState(false)

  const form = useForm<LancamentoInput>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      setContratoSelecionado("")
      setNotasFiscais([])

      form.reset(
        lancamento
          ? {
              tipo: lancamento.tipo,
              descricao: lancamento.descricao,
              categoria_id: lancamento.categoria_id ?? "",
              valor: lancamento.valor,
              data: lancamento.data,
              mes_referencia: lancamento.mes_referencia ?? lancamento.data.slice(0, 7),
              fornecedor_id: lancamento.fornecedor_id ?? "",
              centro_custo_id: lancamento.centro_custo_id ?? "",
              status: lancamento.status,
            }
          : emptyValues
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lancamento])

  async function onSubmit(values: LancamentoInput) {
    if (precisaEscolherContrato && !contratoSelecionado) {
      toast.error("Selecione o contrato")
      return
    }
    try {
      if (isEditing) {
        await updateLancamento.mutateAsync({
          id: lancamento.id,
          input: values,
          filesToAdd: notasFiscais,
        })
        toast.success("Lançamento atualizado")
      } else {
        await createLancamento.mutateAsync({ input: values, files: notasFiscais })
        toast.success("Lançamento cadastrado")
      }
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o lançamento"
      )
    }
  }

  async function handleVerAnexo(storagePath: string) {
    try {
      const url = await downloadDocumento.mutateAsync(storagePath)
      window.open(url, "_blank")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o anexo")
    }
  }

  async function handleExcluirAnexo(id: string, storagePath: string) {
    if (!confirm("Deseja realmente excluir este anexo?")) return
    try {
      await deleteDocumentoLancamento.mutateAsync({ id, storagePath })
      toast.success("Anexo excluído")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o anexo")
    }
  }

  const isSubmitting = createLancamento.isPending || updateLancamento.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>Lançamento financeiro vinculado ao contrato.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {precisaEscolherContrato && (
              <div className="flex flex-col gap-2">
                <Label>Contrato</Label>
                <Select value={contratoSelecionado} onValueChange={setContratoSelecionado}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.numero} · {c.clientes?.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lancamentoTipoOptions.map((opt) => (
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
                        {lancamentoStatusOptions.map((opt) => (
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
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                name="mes_referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês Referência</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => {
                      if (v === "new") {
                        setOpenNovaCat(true)
                      } else {
                        field.onChange(v === "none" ? "" : v)
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {categorias?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                      <SelectItem value="new" className="text-primary font-medium cursor-pointer">
                        + Criar nova
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => {
                        if (v === "new") {
                          setOpenNovoForn(true)
                        } else {
                          field.onChange(v === "none" ? "" : v)
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {fornecedores?.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome}
                          </SelectItem>
                        ))}
                        <SelectItem value="new" className="text-primary font-medium cursor-pointer">
                          + Criar novo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="centro_custo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de custo</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => {
                        if (v === "new") {
                          setOpenNovoCentro(true)
                        } else {
                          field.onChange(v === "none" ? "" : v)
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {centroCustos?.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.nome}
                          </SelectItem>
                        ))}
                        <SelectItem value="new" className="text-primary font-medium cursor-pointer">
                          + Criar novo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Anexar Documentos</Label>
              {anexos && anexos.length > 0 && (
                <div className="flex flex-col gap-2">
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleVerAnexo(anexo.storage_path)}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <Paperclip className="size-4 shrink-0" />
                        <span className="truncate">{anexo.nome}</span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleExcluirAnexo(anexo.id, anexo.storage_path)}
                        disabled={deleteDocumentoLancamento.isPending}
                      >
                        <X className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {lancamento?.documento_url && (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm opacity-60">
                  <span className="flex items-center gap-2">
                    <Paperclip className="size-4 shrink-0" />
                    Anexo legado (apenas visualização)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerAnexo(lancamento.documento_url!)}
                  >
                    Ver
                  </Button>
                </div>
              )}
              <Input
                type="file"
                multiple
                onChange={(e) => setNotasFiscais(Array.from(e.target.files ?? []))}
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
      <CriarNovoDialog
        title="Nova Categoria"
        isOpen={openNovaCat}
        onOpenChange={setOpenNovaCat}
        isPending={createCategoria.isPending}
        centrosCusto={centroCustos}
        onSalvar={(nome, centroCustoId) => {
          createCategoria.mutate(
            { 
              nome, 
              tipo: form.getValues("tipo") === "receita" ? "receita" : "despesa",
              centro_custo_id: centroCustoId || undefined
            },
            {
              onSuccess: (res) => {
                toast.success("Categoria criada")
                form.setValue("categoria_id", res.id)
                setOpenNovaCat(false)
              },
              onError: (err) => toast.error(err.message),
            }
          )
        }}
      />
      <CriarNovoDialog
        title="Novo Fornecedor"
        isOpen={openNovoForn}
        onOpenChange={setOpenNovoForn}
        isPending={createFornecedor.isPending}
        onSalvar={(nome) => {
          createFornecedor.mutate(
            { nome },
            {
              onSuccess: (res) => {
                toast.success("Fornecedor criado")
                form.setValue("fornecedor_id", res.id)
                setOpenNovoForn(false)
              },
              onError: (err) => toast.error(err.message),
            }
          )
        }}
      />
      <CriarNovoDialog
        title="Novo Centro de Custo"
        isOpen={openNovoCentro}
        onOpenChange={setOpenNovoCentro}
        isPending={createCentroCusto.isPending}
        onSalvar={(nome) => {
          createCentroCusto.mutate(
            { nome },
            {
              onSuccess: (res) => {
                toast.success("Centro de custo criado")
                form.setValue("centro_custo_id", res.id)
                setOpenNovoCentro(false)
              },
              onError: (err) => toast.error(err.message),
            }
          )
        }}
      />
    </Dialog>
  )
}
