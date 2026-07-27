-- Coluna usada para registrar quem anexou/cadastrou a empresa na cotação
-- (usada por useAddEmpresa e useAddEmpresaComPdf, mas nunca tinha sido criada).
alter table cotacao_empresas add column anexado_por text;
