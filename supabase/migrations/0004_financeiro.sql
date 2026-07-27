-- Lançamentos financeiros e medições

create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  tipo lancamento_tipo not null,
  descricao text not null,
  categoria_id uuid references categorias (id),
  valor numeric(14, 2) not null,
  data date not null,
  fornecedor_id uuid references fornecedores (id),
  centro_custo_id uuid references centro_custos (id),
  documento_url text,
  status lancamento_status not null default 'pendente',
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lancamentos_contrato_idx on lancamentos (contrato_id);
create index lancamentos_data_idx on lancamentos (data);
create index lancamentos_tipo_idx on lancamentos (tipo);
create index lancamentos_status_idx on lancamentos (status);

create table medicoes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  numero integer not null,
  competencia date not null,
  valor numeric(14, 2) not null,
  percentual_executado numeric(5, 2) not null default 0 check (percentual_executado >= 0 and percentual_executado <= 100),
  data date,
  status medicao_status not null default 'pendente',
  arquivo_url text,
  lancamento_id uuid references lancamentos (id),
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_id, numero)
);

create index medicoes_contrato_idx on medicoes (contrato_id);
create index medicoes_status_idx on medicoes (status);
