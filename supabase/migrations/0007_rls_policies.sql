-- Row Level Security: leitura liberada a qualquer usuário autenticado,
-- escrita restrita por papel via auth_role().

alter table usuarios enable row level security;
alter table clientes enable row level security;
alter table fornecedores enable row level security;
alter table centro_custos enable row level security;
alter table categorias enable row level security;
alter table contratos enable row level security;
alter table aditivos enable row level security;
alter table cronograma enable row level security;
alter table lancamentos enable row level security;
alter table medicoes enable row level security;
alter table documentos enable row level security;
alter table comentarios enable row level security;
alter table historico enable row level security;
alter table notificacoes_lidas enable row level security;

-- usuarios ------------------------------------------------------------
create policy "usuarios_select" on usuarios for select to authenticated using (true);
create policy "usuarios_update" on usuarios for update to authenticated
  using (id = auth.uid() or public.auth_role() = 'admin')
  with check (id = auth.uid() or public.auth_role() = 'admin');
create policy "usuarios_delete" on usuarios for delete to authenticated
  using (public.auth_role() = 'admin');

-- clientes / fornecedores / centro_custos / categorias -----------------
create policy "clientes_select" on clientes for select to authenticated using (true);
create policy "clientes_insert" on clientes for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "clientes_update" on clientes for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "clientes_delete" on clientes for delete to authenticated
  using (public.auth_role() = 'admin');

create policy "fornecedores_select" on fornecedores for select to authenticated using (true);
create policy "fornecedores_insert" on fornecedores for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "fornecedores_update" on fornecedores for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro'))
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "fornecedores_delete" on fornecedores for delete to authenticated
  using (public.auth_role() = 'admin');

create policy "centro_custos_select" on centro_custos for select to authenticated using (true);
create policy "centro_custos_insert" on centro_custos for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "centro_custos_update" on centro_custos for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro'))
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "centro_custos_delete" on centro_custos for delete to authenticated
  using (public.auth_role() = 'admin');

create policy "categorias_select" on categorias for select to authenticated using (true);
create policy "categorias_insert" on categorias for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "categorias_update" on categorias for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro'))
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "categorias_delete" on categorias for delete to authenticated
  using (public.auth_role() = 'admin');

-- contratos / aditivos --------------------------------------------------
create policy "contratos_select" on contratos for select to authenticated using (true);
create policy "contratos_insert" on contratos for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "contratos_update" on contratos for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "contratos_delete" on contratos for delete to authenticated
  using (public.auth_role() = 'admin');

create policy "aditivos_select" on aditivos for select to authenticated using (true);
create policy "aditivos_insert" on aditivos for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "aditivos_update" on aditivos for update to authenticated
  using (public.auth_role() in ('admin', 'gestor'))
  with check (public.auth_role() in ('admin', 'gestor'));
create policy "aditivos_delete" on aditivos for delete to authenticated
  using (public.auth_role() = 'admin');

-- cronograma --------------------------------------------------------
create policy "cronograma_select" on cronograma for select to authenticated using (true);
create policy "cronograma_insert" on cronograma for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'fiscal'));
create policy "cronograma_update" on cronograma for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'fiscal'))
  with check (public.auth_role() in ('admin', 'gestor', 'fiscal'));
create policy "cronograma_delete" on cronograma for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

-- lancamentos ---------------------------------------------------------
create policy "lancamentos_select" on lancamentos for select to authenticated using (true);
create policy "lancamentos_insert" on lancamentos for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "lancamentos_update" on lancamentos for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro'))
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro'));
create policy "lancamentos_delete" on lancamentos for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro'));

-- medicoes ------------------------------------------------------------
create policy "medicoes_select" on medicoes for select to authenticated using (true);
create policy "medicoes_insert" on medicoes for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal'));
create policy "medicoes_update" on medicoes for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal'))
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal'));
create policy "medicoes_delete" on medicoes for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

-- documentos ----------------------------------------------------------
create policy "documentos_select" on documentos for select to authenticated using (true);
create policy "documentos_insert" on documentos for insert to authenticated
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal'));
create policy "documentos_update" on documentos for update to authenticated
  using (public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal'))
  with check (public.auth_role() in ('admin', 'gestor', 'financeiro', 'fiscal'));
create policy "documentos_delete" on documentos for delete to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

-- comentarios -----------------------------------------------------------
create policy "comentarios_select" on comentarios for select to authenticated using (true);
create policy "comentarios_insert" on comentarios for insert to authenticated
  with check (usuario_id = auth.uid());
create policy "comentarios_update" on comentarios for update to authenticated
  using (usuario_id = auth.uid() or public.auth_role() = 'admin')
  with check (usuario_id = auth.uid() or public.auth_role() = 'admin');
create policy "comentarios_delete" on comentarios for delete to authenticated
  using (usuario_id = auth.uid() or public.auth_role() = 'admin');

-- historico: somente leitura para admin/gestor; escrita só via trigger --
create policy "historico_select" on historico for select to authenticated
  using (public.auth_role() in ('admin', 'gestor'));

-- notificacoes_lidas: cada usuário só vê/gerencia o próprio estado ------
create policy "notificacoes_lidas_all" on notificacoes_lidas for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
