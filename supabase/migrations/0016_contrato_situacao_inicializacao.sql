-- Adiciona "inicializacao" ao enum de situação do contrato, usado pelo
-- formulário mas ausente no enum original (0001_enums.sql).

alter type contrato_situacao add value if not exists 'inicializacao';
