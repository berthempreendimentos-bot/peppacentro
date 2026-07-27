-- Views e funções de apoio ao Dashboard, gráficos e notificações.
-- Rodam com os privilégios de quem consulta (respeitam as RLS já definidas).

-- Notificações: calculadas em tempo real a partir dos dados, sem tabela
-- própria para os alertas (só o estado "lida" fica persistido, ver
-- notificacoes_lidas). Cobre: contrato vencendo/precisando de aditivo,
-- documento vencido ou vencendo (inclui seguro/garantia, que são só
-- documentos com categoria livre e data de validade), medição atrasada
-- e pagamento atrasado.
create view view_notificacoes with (security_invoker = true) as
  select
    'contrato_vencendo' as tipo,
    c.id as contrato_id,
    'Contrato ' || c.numero || ' vence em ' || to_char(c.data_fim, 'DD/MM/YYYY') as mensagem,
    c.data_fim as data_referencia,
    'contrato_vencendo:' || c.id as chave
  from contratos c
  where c.situacao = 'em_andamento'
    and c.data_fim is not null
    and c.data_fim between current_date and current_date + interval '30 days'

  union all

  select
    case when d.validade < current_date then 'documento_vencido' else 'documento_vencendo' end,
    d.contrato_id,
    'Documento "' || d.nome || '" ' || (case when d.validade < current_date then 'venceu em ' else 'vence em ' end) || to_char(d.validade, 'DD/MM/YYYY'),
    d.validade,
    'documento:' || d.id
  from documentos d
  where d.validade is not null
    and d.validade <= current_date + interval '30 days'

  union all

  select
    'medicao_atrasada',
    m.contrato_id,
    'Medição nº ' || m.numero || ' está pendente desde ' || to_char(m.competencia, 'MM/YYYY'),
    m.competencia,
    'medicao:' || m.id
  from medicoes m
  where m.status = 'pendente'
    and m.competencia < date_trunc('month', current_date)

  union all

  select
    'pagamento_atrasado',
    l.contrato_id,
    'Lançamento "' || l.descricao || '" está atrasado desde ' || to_char(l.data, 'DD/MM/YYYY'),
    l.data,
    'lancamento:' || l.id
  from lancamentos l
  where l.status = 'pendente'
    and l.tipo in ('pagamento', 'despesa')
    and l.data < current_date;

-- KPIs do topo do Dashboard.
create function public.dashboard_kpis()
returns table (
  contratos_ativos bigint,
  valor_total numeric,
  executado numeric,
  saldo numeric,
  medicoes_pendentes bigint,
  documentos_pendentes bigint,
  contratos_proximos_vencimento bigint
)
language sql
stable
as $$
  select
    (select count(*) from contratos where situacao = 'em_andamento'),
    (select coalesce(sum(valor_atual), 0) from contratos where situacao <> 'cancelado'),
    (select coalesce(sum(valor), 0) from medicoes where status in ('aprovada', 'paga')),
    (select coalesce(sum(valor_atual), 0) from contratos where situacao <> 'cancelado')
      - (select coalesce(sum(valor), 0) from medicoes where status in ('aprovada', 'paga')),
    (select count(*) from medicoes where status = 'pendente'),
    (select count(*) from documentos where validade is not null and validade <= current_date + interval '30 days'),
    (select count(*) from contratos where situacao = 'em_andamento' and data_fim between current_date and current_date + interval '30 days');
$$;

-- Evolução financeira / gastos por mês (últimos 12 meses).
create view view_financeiro_mensal with (security_invoker = true) as
  select
    date_trunc('month', l.data)::date as mes,
    sum(l.valor) filter (where l.tipo in ('receita', 'recebimento', 'medicao')) as receitas,
    sum(l.valor) filter (where l.tipo in ('despesa', 'pagamento', 'impostos', 'retencao')) as despesas
  from lancamentos l
  where l.data >= date_trunc('month', current_date) - interval '11 months'
  group by 1
  order by 1;

-- Gastos por categoria (para o gráfico de pizza).
create view view_gastos_por_categoria with (security_invoker = true) as
  select
    coalesce(cat.nome, 'Sem categoria') as categoria,
    sum(l.valor) as total
  from lancamentos l
  left join categorias cat on cat.id = l.categoria_id
  where l.tipo in ('despesa', 'pagamento', 'impostos', 'retencao')
  group by 1
  order by 2 desc;

-- Situação dos contratos (para o gráfico de status).
create view view_situacao_contratos with (security_invoker = true) as
  select situacao, count(*) as total
  from contratos
  group by situacao;

-- Contratos por cliente.
create view view_contratos_por_cliente with (security_invoker = true) as
  select cl.nome as cliente, count(c.id) as total
  from contratos c
  join clientes cl on cl.id = c.cliente_id
  group by cl.nome
  order by total desc;

-- Comparativo (valor contratado x executado x recebido x lucro) por contrato.
create function public.contrato_resumo_financeiro(p_contrato_id uuid)
returns table (
  valor_contratado numeric,
  valor_executado numeric,
  valor_recebido numeric,
  valor_despesas numeric,
  lucro numeric
)
language sql
stable
as $$
  select
    (select valor_atual from contratos where id = p_contrato_id),
    (select coalesce(sum(valor), 0) from medicoes where contrato_id = p_contrato_id and status in ('aprovada', 'paga')),
    (select coalesce(sum(valor), 0) from lancamentos where contrato_id = p_contrato_id and tipo in ('recebimento', 'medicao')),
    (select coalesce(sum(valor), 0) from lancamentos where contrato_id = p_contrato_id and tipo in ('despesa', 'pagamento', 'impostos', 'retencao')),
    (select coalesce(sum(valor), 0) from lancamentos where contrato_id = p_contrato_id and tipo in ('recebimento', 'medicao'))
      - (select coalesce(sum(valor), 0) from lancamentos where contrato_id = p_contrato_id and tipo in ('despesa', 'pagamento', 'impostos', 'retencao'));
$$;

-- Grants explícitos: objetos criados após o setup inicial do projeto não
-- herdam automaticamente os privilégios default de anon/authenticated.
grant select on view_notificacoes, view_financeiro_mensal, view_gastos_por_categoria, view_situacao_contratos, view_contratos_por_cliente to authenticated;
grant execute on function public.dashboard_kpis() to authenticated;
grant execute on function public.contrato_resumo_financeiro(uuid) to authenticated;
