// Tipos manuais espelhando supabase/migrations/*.sql.
// Se preferir, regenere automaticamente depois com:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts

export type UserRole = "admin" | "gestor" | "financeiro" | "fiscal" | "visualizador"
export type PessoaTipo = "PF" | "PJ"
export type ContratoSituacao = "em_andamento" | "executado" | "encerrado" | "cancelado" | "inicializacao"
export type CronogramaEtapa =
  | "planejamento"
  | "execucao"
  | "fiscalizacao"
  | "medicoes"
  | "pagamento"
  | "entrega"
  | "encerramento"
  | "integracao"
export type CronogramaStatus = "pendente" | "em_andamento" | "concluido" | "atrasado"
export type LancamentoTipo =
  | "receita"
  | "despesa"
  | "pagamento"
  | "recebimento"
  | "retencao"
  | "impostos"
  | "medicao"
export type LancamentoStatus = "pendente" | "pago" | "atrasado" | "cancelado"
export type MedicaoStatus = "pendente" | "aprovada" | "paga" | "atrasada" | "rejeitada"
export type CategoriaTipo = "receita" | "despesa"
export type DocumentoCategoria =
  | "contrato"
  | "edital"
  | "proposta"
  | "art"
  | "nota_fiscal"
  | "boleto"
  | "ordem_servico"
  | "foto"
  | "relatorio"
  | "planilha"
  | "aditivo"
  | "apolice"
  | "outro"
export type CotacaoStatus = "aberta" | "fechada" | "cancelada"
export type GrauInsalubridade = "nenhum" | "minimo" | "medio" | "maximo"

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          role: UserRole
          ativo: boolean
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["usuarios"]["Row"]> & {
          id: string
          nome: string
          email: string
        }
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Row"]>
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          tipo_pessoa: PessoaTipo
          nome: string
          cpf_cnpj: string
          responsavel: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          praca_pagamento: string | null
          observacoes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["clientes"]["Row"]> & {
          tipo_pessoa: PessoaTipo
          nome: string
          cpf_cnpj: string
        }
        Update: Partial<Database["public"]["Tables"]["clientes"]["Row"]>
        Relationships: [Relationship]
      }
      fornecedores: {
        Row: {
          id: string
          nome: string
          cpf_cnpj: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          observacoes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["fornecedores"]["Row"]> & {
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["fornecedores"]["Row"]>
        Relationships: [Relationship]
      }
      empresas: {
        Row: {
          id: string
          nome: string
          nome_fantasia: string | null
          cnpj: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          observacoes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["empresas"]["Row"]> & {
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["empresas"]["Row"]>
        Relationships: [Relationship]
      }
      centro_custos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["centro_custos"]["Row"]> & {
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["centro_custos"]["Row"]>
        Relationships: []
      }
      categorias: {
        Row: {
          id: string
          nome: string
          tipo: CategoriaTipo
          centro_custo_id: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["categorias"]["Row"]> & {
          nome: string
          tipo: CategoriaTipo
        }
        Update: Partial<Database["public"]["Tables"]["categorias"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "categorias_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centro_custos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          id: string
          numero: string
          objeto: string
          cliente_id: string
          empresa: string | null
          tipo: string | null
          fonte_recurso: string | null
          valor_inicial: number
          valor_atual: number
          data_assinatura: string | null
          data_inicio: string | null
          data_fim: string | null
          situacao: ContratoSituacao
          fiscal_id: string | null
          gestor_id: string | null
          iss_aliquota: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["contratos"]["Row"]> & {
          numero: string
          objeto: string
          cliente_id: string
        }
        Update: Partial<Database["public"]["Tables"]["contratos"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_fiscal_id_fkey"
            columns: ["fiscal_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      aditivos: {
        Row: {
          id: string
          contrato_id: string
          prazo_dias: number | null
          novo_valor: number | null
          objeto: string | null
          justificativa: string
          documento_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["aditivos"]["Row"]> & {
          contrato_id: string
          justificativa: string
        }
        Update: Partial<Database["public"]["Tables"]["aditivos"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "aditivos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          id: string
          contrato_id: string
          nome: string
          matricula: string | null
          cpf: string | null
          funcao: string | null
          data_admissao: string | null
          salario_base: number
          vt_informado: number
          vr_informado: number
          recebe_periculosidade: boolean
          faltas: number
          reembolso: number
          reembolso_creche: number
          inss_percentual: number
          grau_insalubridade: GrauInsalubridade
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["funcionarios"]["Row"]> & {
          contrato_id: string
          nome: string
          matricula?: string | null
          faltas?: number
          reembolso?: number
          reembolso_creche?: number
        }
        Update: Partial<Database["public"]["Tables"]["funcionarios"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "funcionarios_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_funcionarios: {
        Row: {
          id: string
          funcionario_id: string
          tipo: "falta" | "reembolso"
          valor: number
          descricao: string
          mes_referencia: string
          created_at: string
          created_by: string | null
        }
        Insert: Partial<Database["public"]["Tables"]["ocorrencias_funcionarios"]["Row"]> & {
          funcionario_id: string
          tipo: "falta" | "reembolso"
          valor: number
          descricao: string
          mes_referencia?: string
        }
        Update: Partial<Database["public"]["Tables"]["ocorrencias_funcionarios"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "ocorrencias_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma: {
        Row: {
          id: string
          contrato_id: string
          etapa: CronogramaEtapa
          data_inicial: string | null
          data_final: string | null
          responsavel_id: string | null
          percentual: number
          status: CronogramaStatus
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["cronograma"]["Row"]> & {
          contrato_id: string
          etapa: CronogramaEtapa
        }
        Update: Partial<Database["public"]["Tables"]["cronograma"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "cronograma_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          id: string
          contrato_id: string
          tipo: LancamentoTipo
          descricao: string
          categoria_id: string | null
          valor: number
          data: string
          fornecedor_id: string | null
          centro_custo_id: string | null
          documento_url: string | null
          status: LancamentoStatus
          mes_referencia: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["lancamentos"]["Row"]> & {
          contrato_id: string
          tipo: LancamentoTipo
          descricao: string
          valor: number
          data: string
          mes_referencia?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["lancamentos"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "lancamentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centro_custos"
            referencedColumns: ["id"]
          },
        ]
      }
      medicoes: {
        Row: {
          id: string
          contrato_id: string
          numero: number
          competencia: string
          valor: number
          percentual_executado: number
          data: string | null
          status: MedicaoStatus
          arquivo_url: string | null
          lancamento_id: string | null
          mao_de_obra: number
          vale_transporte: number
          vale_refeicao: number
          material: number
          valor_contrato: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["medicoes"]["Row"]> & {
          contrato_id: string
          numero: number
          competencia: string
          valor: number
        }
        Update: Partial<Database["public"]["Tables"]["medicoes"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "medicoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          id: string
          contrato_id: string
          nome: string
          categoria: DocumentoCategoria
          storage_path: string
          tamanho: number | null
          validade: string | null
          referencia_tabela: string | null
          referencia_id: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["documentos"]["Row"]> & {
          contrato_id: string
          nome: string
          storage_path: string
        }
        Update: Partial<Database["public"]["Tables"]["documentos"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "documentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          id: string
          contrato_id: string
          usuario_id: string | null
          texto: string
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["comentarios"]["Row"]> & {
          contrato_id: string
          texto: string
        }
        Update: Partial<Database["public"]["Tables"]["comentarios"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "comentarios_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico: {
        Row: {
          id: number
          tabela: string
          registro_id: string
          acao: "insert" | "update" | "delete"
          usuario_id: string | null
          dados_antes: Record<string, unknown> | null
          dados_depois: Record<string, unknown> | null
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      notificacoes_lidas: {
        Row: {
          id: string
          usuario_id: string
          chave: string
          lida_em: string
        }
        Insert: Partial<Database["public"]["Tables"]["notificacoes_lidas"]["Row"]> & {
          usuario_id: string
          chave: string
        }
        Update: Partial<Database["public"]["Tables"]["notificacoes_lidas"]["Row"]>
        Relationships: []
      }
      postos_servico: {
        Row: {
          id: string
          contrato_id: string
          nome: string
          quantidade: number
          modulo_1_remuneracao: number
          modulo_2_encargos_beneficios: number
          modulo_3_provisao_rescisao: number
          modulo_4_reposicao: number
          modulo_5_insumos: number
          modulo_6_indiretos_tributos_lucro: number
          valor_total: number
          documento_id: string | null
          aba_origem: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["postos_servico"]["Row"]> & {
          contrato_id: string
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["postos_servico"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "postos_servico_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      posto_epis: {
        Row: {
          id: string
          posto_servico_id: string
          nome: string
          quantidade: number | null
          valor: number | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["posto_epis"]["Row"]> & {
          posto_servico_id: string
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["posto_epis"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "posto_epis_posto_servico_id_fkey"
            columns: ["posto_servico_id"]
            isOneToOne: false
            referencedRelation: "postos_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas: {
        Row: {
          id: string
          posto_servico_id: string
          nome: string
          quantidade: number | null
          valor_unitario: number | null
          valor_total: number | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["ferramentas"]["Row"]> & {
          posto_servico_id: string
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["ferramentas"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "ferramentas_posto_servico_id_fkey"
            columns: ["posto_servico_id"]
            isOneToOne: false
            referencedRelation: "postos_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      posto_custo_itens: {
        Row: {
          id: string
          posto_servico_id: string
          modulo: number
          descricao: string
          valor: number
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["posto_custo_itens"]["Row"]> & {
          posto_servico_id: string
          modulo: number
          descricao: string
        }
        Update: Partial<Database["public"]["Tables"]["posto_custo_itens"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "posto_custo_itens_posto_servico_id_fkey"
            columns: ["posto_servico_id"]
            isOneToOne: false
            referencedRelation: "postos_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas_contrato: {
        Row: {
          id: string
          contrato_id: string
          nome: string
          quantidade: number
          valor_unitario: number | null
          valor_total: number
          documento_id: string | null
          aba_origem: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["ferramentas_contrato"]["Row"]> & {
          contrato_id: string
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["ferramentas_contrato"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "ferramentas_contrato_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_contrato: {
        Row: {
          id: string
          contrato_id: string
          nome: string
          quantidade: number
          valor_unitario: number | null
          valor_total: number
          documento_id: string | null
          aba_origem: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["servicos_contrato"]["Row"]> & {
          contrato_id: string
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["servicos_contrato"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "servicos_contrato_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          id: string
          contrato_id: string | null
          titulo: string
          descricao: string | null
          status: CotacaoStatus
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["cotacoes"]["Row"]> & {
          titulo: string
        }
        Update: Partial<Database["public"]["Tables"]["cotacoes"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "cotacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacao_itens: {
        Row: {
          id: string
          cotacao_id: string
          descricao: string
          quantidade: number
          unidade: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["cotacao_itens"]["Row"]> & {
          cotacao_id: string
          descricao: string
        }
        Update: Partial<Database["public"]["Tables"]["cotacao_itens"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "cotacao_itens_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacao_empresas: {
        Row: {
          id: string
          cotacao_id: string
          nome: string
          cnpj: string | null
          contato: string | null
          razao_social: string | null
          situacao_cadastral: string | null
          endereco: string | null
          documento_storage_path: string | null
          anexado_por: string | null
          created_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["cotacao_empresas"]["Row"]> & {
          cotacao_id: string
          nome: string
        }
        Update: Partial<Database["public"]["Tables"]["cotacao_empresas"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "cotacao_empresas_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacao_precos: {
        Row: {
          id: string
          cotacao_item_id: string
          cotacao_empresa_id: string
          valor_unitario: number | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database["public"]["Tables"]["cotacao_precos"]["Row"]> & {
          cotacao_item_id: string
          cotacao_empresa_id: string
        }
        Update: Partial<Database["public"]["Tables"]["cotacao_precos"]["Row"]>
        Relationships: [
          {
            foreignKeyName: "cotacao_precos_cotacao_item_id_fkey"
            columns: ["cotacao_item_id"]
            isOneToOne: false
            referencedRelation: "cotacao_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacao_precos_cotacao_empresa_id_fkey"
            columns: ["cotacao_empresa_id"]
            isOneToOne: false
            referencedRelation: "cotacao_empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_notificacoes: {
        Row: {
          tipo: string
          contrato_id: string
          mensagem: string
          data_referencia: string | null
          chave: string
        }
        Relationships: []
      }
      view_financeiro_mensal: {
        Row: {
          mes: string
          receitas: number | null
          despesas: number | null
        }
        Relationships: []
      }
      view_gastos_por_categoria: {
        Row: {
          categoria: string
          total: number
        }
        Relationships: []
      }
      view_situacao_contratos: {
        Row: {
          situacao: ContratoSituacao
          total: number
        }
        Relationships: []
      }
      view_contratos_por_cliente: {
        Row: {
          cliente: string
          total: number
        }
        Relationships: []
      }
    }
    Functions: {
      auth_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      dashboard_kpis: {
        Args: Record<string, never>
        Returns: {
          contratos_ativos: number
          valor_total: number
          executado: number
          saldo: number
          medicoes_pendentes: number
          documentos_pendentes: number
          contratos_proximos_vencimento: number
        }[]
      }
      contrato_resumo_financeiro: {
        Args: { p_contrato_id: string }
        Returns: {
          valor_contratado: number
          valor_executado: number
          valor_recebido: number
          valor_despesas: number
          lucro: number
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
