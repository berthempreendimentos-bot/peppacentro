-- O gatilho que agrega ocorrencias_funcionarios em funcionarios.reembolso
-- ainda somava só tipo = 'reembolso', deixando de fora os lançamentos de
-- Reembolso de ASO (tipo = 'aso') importados via planilha.
CREATE OR REPLACE FUNCTION public.atualiza_totais_ocorrencias()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
        f_id uuid;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          f_id := OLD.funcionario_id;
        ELSE
          f_id := NEW.funcionario_id;
        END IF;

        UPDATE funcionarios
        SET
          faltas = COALESCE((SELECT SUM(valor) FROM ocorrencias_funcionarios WHERE funcionario_id = f_id AND tipo = 'falta'), 0),
          reembolso = COALESCE((SELECT SUM(valor) FROM ocorrencias_funcionarios WHERE funcionario_id = f_id AND tipo IN ('reembolso', 'aso')), 0)
        WHERE id = f_id;

        RETURN NULL;
      END;
      $function$
