-- Documentos (metadados dos arquivos no Storage), comentários e log de histórico

create table documentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  nome text not null,
  categoria documento_categoria not null default 'outro',
  storage_path text not null,
  tamanho bigint,
  validade date,
  referencia_tabela text,
  referencia_id uuid,
  uploaded_by uuid references usuarios (id),
  created_at timestamptz not null default now()
);

create index documentos_contrato_idx on documentos (contrato_id);
create index documentos_categoria_idx on documentos (categoria);
create index documentos_validade_idx on documentos (validade);

create table comentarios (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  usuario_id uuid references usuarios (id),
  texto text not null,
  created_at timestamptz not null default now()
);

create index comentarios_contrato_idx on comentarios (contrato_id);

create table historico (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  usuario_id uuid references usuarios (id),
  dados_antes jsonb,
  dados_depois jsonb,
  created_at timestamptz not null default now()
);

create index historico_tabela_registro_idx on historico (tabela, registro_id);

-- Estado de leitura das notificações calculadas (a lista em si é uma view, ver 0009)
create table notificacoes_lidas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  chave text not null,
  lida_em timestamptz not null default now(),
  unique (usuario_id, chave)
);
