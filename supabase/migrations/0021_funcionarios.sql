-- Funcionários alocados no contrato, para a aba "Funcionários" (folha e
-- encargos por funcionário). Os percentuais (VT, periculosidade, VA, FGTS,
-- INSS patronal, RAT, terceiros) são calculados em tela a partir dos campos
-- aqui salvos (lib/calculo-folha.ts) — só o INSS do empregado tem percentual
-- editável por funcionário, pois varia caso a caso.

create table funcionarios (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  nome text not null,
  cpf text,
  funcao text,
  data_admissao date,
  salario_base numeric(14, 2) not null default 0,
  vt_informado numeric(14, 2) not null default 0,
  vr_informado numeric(14, 2) not null default 0,
  recebe_periculosidade boolean not null default false,
  inss_percentual numeric(5, 2) not null default 11,
  created_by uuid references usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index funcionarios_contrato_idx on funcionarios (contrato_id);

create trigger set_updated_at before update on funcionarios
  for each row execute function public.set_updated_at();

alter table funcionarios enable row level security;

create policy "funcionarios_select" on funcionarios for select to authenticated using (true);
create policy "funcionarios_insert" on funcionarios for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "funcionarios_update" on funcionarios for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "funcionarios_delete" on funcionarios for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));
