-- Ferramentas e Serviços passam a ter listas próprias no nível do
-- contrato (não vinculadas a um posto específico), com total próprio,
-- somando ao lado do custo por posto na aba Planilha de Custo.

create table ferramentas_contrato (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  nome text not null,
  quantidade integer not null default 1,
  valor_unitario numeric(14, 2),
  valor_total numeric(14, 2) not null default 0,
  documento_id uuid references documentos (id) on delete set null,
  aba_origem text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ferramentas_contrato_contrato_idx on ferramentas_contrato (contrato_id);

create table servicos_contrato (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  nome text not null,
  quantidade integer not null default 1,
  valor_unitario numeric(14, 2),
  valor_total numeric(14, 2) not null default 0,
  documento_id uuid references documentos (id) on delete set null,
  aba_origem text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index servicos_contrato_contrato_idx on servicos_contrato (contrato_id);

create trigger set_updated_at before update on ferramentas_contrato for each row execute function public.set_updated_at();
create trigger set_updated_at before update on servicos_contrato for each row execute function public.set_updated_at();

create trigger log_historico after insert or update or delete on ferramentas_contrato for each row execute function public.log_historico();
create trigger log_historico after insert or update or delete on servicos_contrato for each row execute function public.log_historico();

alter table ferramentas_contrato enable row level security;
alter table servicos_contrato enable row level security;

create policy "ferramentas_contrato_select" on ferramentas_contrato for select to authenticated using (true);
create policy "ferramentas_contrato_insert" on ferramentas_contrato for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "ferramentas_contrato_update" on ferramentas_contrato for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "ferramentas_contrato_delete" on ferramentas_contrato for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

create policy "servicos_contrato_select" on servicos_contrato for select to authenticated using (true);
create policy "servicos_contrato_insert" on servicos_contrato for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "servicos_contrato_update" on servicos_contrato for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "servicos_contrato_delete" on servicos_contrato for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));
