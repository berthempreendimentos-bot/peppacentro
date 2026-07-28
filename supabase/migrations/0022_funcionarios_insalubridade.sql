-- Grau de insalubridade do funcionário, calculado sobre o salário mínimo
-- (não sobre o salário base, diferente da periculosidade) — usado na
-- "Remuneração Total" da aba Conta-Depósito Vinculada e no cadastro.

create type grau_insalubridade as enum ('nenhum', 'minimo', 'medio', 'maximo');

alter table funcionarios
  add column grau_insalubridade grau_insalubridade not null default 'nenhum';
