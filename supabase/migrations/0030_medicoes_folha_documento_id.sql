alter table medicoes
  add column folha_documento_id uuid references documentos (id) on delete set null;
