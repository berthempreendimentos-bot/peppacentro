-- Itens de custo que compõem cada módulo do posto de serviço (guardados no
-- momento da importação da planilha, para permitir ver o detalhamento por
-- módulo depois, não só o total somado).

create table posto_custo_itens (
  id uuid primary key default gen_random_uuid(),
  posto_servico_id uuid not null references postos_servico (id) on delete cascade,
  modulo smallint not null check (modulo between 1 and 6),
  descricao text not null,
  valor numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index posto_custo_itens_posto_idx on posto_custo_itens (posto_servico_id);
create index posto_custo_itens_modulo_idx on posto_custo_itens (posto_servico_id, modulo);

alter table posto_custo_itens enable row level security;

create policy "posto_custo_itens_select" on posto_custo_itens for select to authenticated using (true);
create policy "posto_custo_itens_insert" on posto_custo_itens for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "posto_custo_itens_update" on posto_custo_itens for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "posto_custo_itens_delete" on posto_custo_itens for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));
