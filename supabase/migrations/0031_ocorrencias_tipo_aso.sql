-- Adiciona o tipo "aso" (Atestado de Saúde Ocupacional) às ocorrências de
-- funcionários, para reembolsos de ASO lançados em lote por importação.
alter table ocorrencias_funcionarios
  drop constraint ocorrencias_funcionarios_tipo_check;

alter table ocorrencias_funcionarios
  add constraint ocorrencias_funcionarios_tipo_check
  check (tipo = any (array['falta'::text, 'reembolso'::text, 'aso'::text]));
