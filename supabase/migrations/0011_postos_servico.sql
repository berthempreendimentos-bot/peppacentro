-- Postos de serviço (cargos) por contrato, com custos detalhados, EPIs e
-- ferramentas extraídos da planilha de custo enviada em Documentos.

create table postos_servico (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  nome text not null,
  quantidade integer not null default 1,
  salario numeric(14, 2) not null default 0,
  encargos numeric(14, 2) not null default 0,
  beneficios numeric(14, 2) not null default 0,
  insumos numeric(14, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  documento_id uuid references documentos (id) on delete set null,
  aba_origem text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index postos_servico_contrato_idx on postos_servico (contrato_id);

create table posto_epis (
  id uuid primary key default gen_random_uuid(),
  posto_servico_id uuid not null references postos_servico (id) on delete cascade,
  nome text not null,
  quantidade integer default 1,
  valor numeric(14, 2),
  created_at timestamptz not null default now()
);

create index posto_epis_posto_idx on posto_epis (posto_servico_id);

create table ferramentas (
  id uuid primary key default gen_random_uuid(),
  posto_servico_id uuid not null references postos_servico (id) on delete cascade,
  nome text not null,
  quantidade integer default 1,
  valor_unitario numeric(14, 2),
  valor_total numeric(14, 2),
  created_at timestamptz not null default now()
);

create index ferramentas_posto_idx on ferramentas (posto_servico_id);

create trigger set_updated_at before update on postos_servico for each row execute function public.set_updated_at();

create trigger log_historico after insert or update or delete on postos_servico for each row execute function public.log_historico();

alter table postos_servico enable row level security;
alter table posto_epis enable row level security;
alter table ferramentas enable row level security;

create policy "postos_servico_select" on postos_servico for select to authenticated using (true);
create policy "postos_servico_insert" on postos_servico for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "postos_servico_update" on postos_servico for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "postos_servico_delete" on postos_servico for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

create policy "posto_epis_select" on posto_epis for select to authenticated using (true);
create policy "posto_epis_insert" on posto_epis for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "posto_epis_update" on posto_epis for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "posto_epis_delete" on posto_epis for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

create policy "ferramentas_select" on ferramentas for select to authenticated using (true);
create policy "ferramentas_insert" on ferramentas for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "ferramentas_update" on ferramentas for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "ferramentas_delete" on ferramentas for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));
