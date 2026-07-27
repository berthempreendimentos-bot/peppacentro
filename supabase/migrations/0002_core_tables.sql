-- Tabelas de apoio: usuários, clientes, fornecedores, centro de custos, categorias

create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  role user_role not null default 'visualizador',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  tipo_pessoa pessoa_tipo not null,
  nome text not null,
  cpf_cnpj text not null unique,
  responsavel text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf_cnpj text unique,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table centro_custos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  created_at timestamptz not null default now()
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo categoria_tipo not null,
  centro_custo_id uuid references centro_custos (id),
  created_at timestamptz not null default now(),
  unique (nome, tipo)
);

create index clientes_nome_idx on clientes using gin (to_tsvector('simple', nome));
create index fornecedores_nome_idx on fornecedores using gin (to_tsvector('simple', nome));
