-- Campos gravados na medição para poder lançar, sem recalcular depois,
-- os valores de Contas a Receber (valor_liquido, "VALOR TOTAL" do espelho,
-- já líquido de retenções) e de Contas a Pagar (líquido dos empregados +
-- FGTS + VT + VA + valor vinculado na Conta-Depósito Vinculada).
alter table medicoes
  add column liquido_empregados numeric(14, 2) not null default 0,
  add column fgts numeric(14, 2) not null default 0,
  add column valor_vinculado numeric(14, 2) not null default 0,
  add column valor_liquido numeric(14, 2) not null default 0;
