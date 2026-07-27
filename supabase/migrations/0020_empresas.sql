-- Cadastro das empresas próprias (filiais/CNPJs operacionais), usado pelo
-- painel de configuração master. Independente do campo texto livre
-- "empresa" já existente em contratos.

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_fantasia text,
  cnpj text unique,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index empresas_nome_idx on empresas using gin (to_tsvector('simple', nome));

create trigger set_updated_at before update on empresas
  for each row execute function public.set_updated_at();

alter table empresas enable row level security;

create policy "empresas_select" on empresas for select to authenticated using (true);
create policy "empresas_insert" on empresas for insert to authenticated
  with check (public.auth_role() = 'admin');
create policy "empresas_update" on empresas for update to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');
create policy "empresas_delete" on empresas for delete to authenticated
  using (public.auth_role() = 'admin');
