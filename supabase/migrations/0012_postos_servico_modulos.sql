-- Substitui o detalhamento genérico (salário/encargos/benefícios/insumos) pelo
-- modelo padrão da Planilha de Custos e Formação de Preços (IN 5/2017),
-- com os 6 módulos oficiais.

alter table postos_servico
  drop column if exists salario,
  drop column if exists encargos,
  drop column if exists beneficios,
  drop column if exists insumos;

alter table postos_servico
  add column if not exists modulo_1_remuneracao numeric(14, 2) not null default 0,
  add column if not exists modulo_2_encargos_beneficios numeric(14, 2) not null default 0,
  add column if not exists modulo_3_provisao_rescisao numeric(14, 2) not null default 0,
  add column if not exists modulo_4_reposicao numeric(14, 2) not null default 0,
  add column if not exists modulo_5_insumos numeric(14, 2) not null default 0,
  add column if not exists modulo_6_indiretos_tributos_lucro numeric(14, 2) not null default 0;
