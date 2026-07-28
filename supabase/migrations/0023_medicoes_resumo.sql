-- Campos usados no resumo da medição (mão de obra, VT, VR e material) que
-- compõem o "Valor a Faturar". As retenções (INSS, IRRF, PIS, COFINS, CSLL,
-- ISS) são calculadas em tempo real a partir desses valores (lib/calculo-medicao.ts),
-- não são persistidas, para evitar divergência entre valor salvo e fórmula.
alter table medicoes
  add column mao_de_obra numeric(14, 2) not null default 0,
  add column vale_transporte numeric(14, 2) not null default 0,
  add column vale_refeicao numeric(14, 2) not null default 0,
  add column material numeric(14, 2) not null default 0;

-- Alíquota de ISS varia por município do contrato, por isso fica no
-- cadastro do contrato (não é um percentual fixo do sistema como o INSS/PIS/COFINS/CSLL).
alter table contratos
  add column iss_aliquota numeric(5, 2) not null default 5.00;
