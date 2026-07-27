// Cria (ou promove) o primeiro usuário admin do sistema.
// Uso: node scripts/create-admin.mjs <email> <senha> ["Nome Completo"]
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

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

const [, , email, password, nome] = process.argv

if (!email || !password) {
  console.error("Uso: node scripts/create-admin.mjs <email> <senha> [\"Nome\"]")
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local")
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: nome ? { nome } : undefined,
})

let userId = created?.user?.id

if (createError) {
  if (!createError.message.includes("already been registered")) {
    console.error("Erro ao criar usuário:", createError.message)
    process.exit(1)
  }
  const { data: list, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    console.error("Erro ao localizar usuário existente:", listError.message)
    process.exit(1)
  }
  userId = list.users.find((u) => u.email === email)?.id
}

if (!userId) {
  console.error("Não foi possível determinar o id do usuário.")
  process.exit(1)
}

const { error: promoteError } = await admin
  .from("usuarios")
  .update({ role: "admin", nome: nome ?? undefined })
  .eq("id", userId)

if (promoteError) {
  console.error("Erro ao promover a admin:", promoteError.message)
  process.exit(1)
}

console.log(`Usuário ${email} pronto e promovido a admin.`)
