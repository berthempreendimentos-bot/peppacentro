ALTER TABLE lancamentos
ADD COLUMN IF NOT EXISTS classificacao varchar(50) NOT NULL DEFAULT 'normal';

DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='lancamentos' AND column_name='is_recorrente') THEN
    UPDATE lancamentos SET classificacao = 'recorrente' WHERE is_recorrente = true;
    ALTER TABLE lancamentos DROP COLUMN is_recorrente;
  END IF;
END $$;
