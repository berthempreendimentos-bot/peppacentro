-- Dados oficiais da empresa (obtidos via consulta de CNPJ) e referência ao
-- PDF da cotação enviada por ela.

alter table cotacao_empresas
  add column razao_social text,
  add column situacao_cadastral text,
  add column endereco text,
  add column documento_storage_path text;
