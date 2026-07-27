-- Cotações de preços: permite cadastrar itens (produtos/serviços) e
-- empresas concorrentes, lançar o preço de cada empresa por item, e
-- comparar para identificar a melhor oferta. Pode ou não estar vinculada
-- a um contrato.

create type cotacao_status as enum ('aberta', 'fechada', 'cancelada');

create table cotacoes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references contratos (id) on delete set null,
  titulo text not null,
  descricao text,
  status cotacao_status not null default 'aberta',
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cotacoes_contrato_idx on cotacoes (contrato_id);

create table cotacao_itens (
  id uuid primary key default gen_random_uuid(),
  cotacao_id uuid not null references cotacoes (id) on delete cascade,
  descricao text not null,
  quantidade numeric(14, 2) not null default 1,
  unidade text,
  created_at timestamptz not null default now()
);

create index cotacao_itens_cotacao_idx on cotacao_itens (cotacao_id);

create table cotacao_empresas (
  id uuid primary key default gen_random_uuid(),
  cotacao_id uuid not null references cotacoes (id) on delete cascade,
  nome text not null,
  cnpj text,
  contato text,
  created_at timestamptz not null default now()
);

create index cotacao_empresas_cotacao_idx on cotacao_empresas (cotacao_id);

create table cotacao_precos (
  id uuid primary key default gen_random_uuid(),
  cotacao_item_id uuid not null references cotacao_itens (id) on delete cascade,
  cotacao_empresa_id uuid not null references cotacao_empresas (id) on delete cascade,
  valor_unitario numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cotacao_item_id, cotacao_empresa_id)
);

create index cotacao_precos_item_idx on cotacao_precos (cotacao_item_id);
create index cotacao_precos_empresa_idx on cotacao_precos (cotacao_empresa_id);

create trigger set_updated_at before update on cotacoes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on cotacao_precos for each row execute function public.set_updated_at();

create trigger log_historico after insert or update or delete on cotacoes for each row execute function public.log_historico();

alter table cotacoes enable row level security;
alter table cotacao_itens enable row level security;
alter table cotacao_empresas enable row level security;
alter table cotacao_precos enable row level security;

create policy "cotacoes_select" on cotacoes for select to authenticated using (true);
create policy "cotacoes_insert" on cotacoes for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacoes_update" on cotacoes for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacoes_delete" on cotacoes for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

create policy "cotacao_itens_select" on cotacao_itens for select to authenticated using (true);
create policy "cotacao_itens_insert" on cotacao_itens for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacao_itens_update" on cotacao_itens for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacao_itens_delete" on cotacao_itens for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

create policy "cotacao_empresas_select" on cotacao_empresas for select to authenticated using (true);
create policy "cotacao_empresas_insert" on cotacao_empresas for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacao_empresas_update" on cotacao_empresas for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacao_empresas_delete" on cotacao_empresas for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

create policy "cotacao_precos_select" on cotacao_precos for select to authenticated using (true);
create policy "cotacao_precos_insert" on cotacao_precos for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacao_precos_update" on cotacao_precos for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "cotacao_precos_delete" on cotacao_precos for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));
