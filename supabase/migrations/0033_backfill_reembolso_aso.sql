-- Recalcula funcionarios.reembolso para todos os funcionários usando a
-- fórmula corrigida (reembolso + aso), já que os lançamentos de ASO feitos
-- antes da migração 0032 não foram recalculados retroativamente pelo gatilho.
UPDATE funcionarios f
SET reembolso = COALESCE(
  (SELECT SUM(valor) FROM ocorrencias_funcionarios o
   WHERE o.funcionario_id = f.id AND o.tipo IN ('reembolso', 'aso')),
  0
);
