import { Client } from 'pg'

const connectionString = "postgres://postgres.yhqkqxozvlyfnhcxpzjd:PeppaCentro2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

async function run() {
  const client = new Client({
    connectionString: connectionString
  })
  
  await client.connect()
  
  try {
    await client.query(`
      ALTER TABLE lancamentos
      ADD COLUMN IF NOT EXISTS classificacao varchar(50) NOT NULL DEFAULT 'normal';
      
      DO $$ 
      BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='lancamentos' AND column_name='is_recorrente') THEN
          UPDATE lancamentos SET classificacao = 'recorrente' WHERE is_recorrente = true;
        END IF;
      END $$;
    `)
    console.log("Migration successful!")
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}

run()
