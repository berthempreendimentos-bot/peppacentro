// Aplica um arquivo de migration diretamente no Postgres do Supabase,
// sem depender da API de gerenciamento (útil quando o token sbp_ expira).
// Uso: node scripts/run-migration.mjs supabase/migrations/0017_cotacoes.sql
import { readFileSync } from "fs"
import pg from "pg"

function loadEnvLocal() {
  try {
    const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) process.env[match[1]] = process.env[match[1]] ?? match[2]
    }
  } catch {
    // segue usando variáveis já exportadas no shell, se existirem
  }
}

loadEnvLocal()

const [, , file] = process.argv
const connectionString = process.env.SUPABASE_DB_URL

if (!file) {
  console.error("Uso: node scripts/run-migration.mjs <arquivo.sql>")
  process.exit(1)
}

if (!connectionString) {
  console.error(
    "Defina SUPABASE_DB_URL em .env.local (Project Settings > Database > Connection string > URI)."
  )
  process.exit(1)
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  const sql = readFileSync(file, "utf8")
  await client.query(sql)
  console.log(`Migration "${file}" aplicada com sucesso.`)
} catch (error) {
  console.error("Erro ao aplicar a migration:", error.message)
  process.exit(1)
} finally {
  await client.end()
}
