-- "Valor do Contrato" exibido/editável no resumo da medição. Fica gravado
-- por medição (não só lido de contratos.valor_atual) para preservar o
-- valor vigente na época caso o contrato seja reajustado depois.
alter table medicoes
  add column valor_contrato numeric(14, 2) not null default 0;
