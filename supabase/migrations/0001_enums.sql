-- Extensões e tipos enumerados usados em todo o schema

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'gestor', 'financeiro', 'fiscal', 'visualizador');
create type pessoa_tipo as enum ('PF', 'PJ');
create type contrato_situacao as enum ('em_andamento', 'executado', 'encerrado', 'cancelado');
create type cronograma_etapa as enum ('planejamento', 'execucao', 'fiscalizacao', 'medicoes', 'pagamento', 'entrega', 'encerramento');
create type cronograma_status as enum ('pendente', 'em_andamento', 'concluido', 'atrasado');
create type lancamento_tipo as enum ('receita', 'despesa', 'pagamento', 'recebimento', 'retencao', 'impostos', 'medicao');
create type lancamento_status as enum ('pendente', 'pago', 'atrasado', 'cancelado');
create type medicao_status as enum ('pendente', 'aprovada', 'paga', 'atrasada', 'rejeitada');
create type categoria_tipo as enum ('receita', 'despesa');
create type documento_categoria as enum ('contrato', 'edital', 'proposta', 'art', 'nota_fiscal', 'boleto', 'ordem_servico', 'foto', 'relatorio', 'planilha', 'aditivo', 'outro');
