-- Contratos, aditivos e cronograma de execução

create table contratos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  objeto text not null,
  cliente_id uuid not null references clientes (id),
  empresa text,
  tipo text,
  fonte_recurso text,
  valor_inicial numeric(14, 2) not null default 0,
  valor_atual numeric(14, 2) not null default 0,
  data_assinatura date,
  data_inicio date,
  data_fim date,
  situacao contrato_situacao not null default 'em_andamento',
  fiscal_id uuid references usuarios (id),
  gestor_id uuid references usuarios (id),
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contratos_cliente_idx on contratos (cliente_id);
create index contratos_situacao_idx on contratos (situacao);
create index contratos_data_fim_idx on contratos (data_fim);

create table aditivos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  prazo_dias integer,
  novo_valor numeric(14, 2),
  objeto text,
  justificativa text not null,
  documento_url text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now()
);

create index aditivos_contrato_idx on aditivos (contrato_id);

create table cronograma (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  etapa cronograma_etapa not null,
  data_inicial date,
  data_final date,
  responsavel_id uuid references usuarios (id),
  percentual numeric(5, 2) not null default 0 check (percentual >= 0 and percentual <= 100),
  status cronograma_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cronograma_contrato_idx on cronograma (contrato_id);
