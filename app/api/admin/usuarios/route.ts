import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { criarUsuarioSchema } from "@/lib/validations/usuarios"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (perfil?.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem criar usuários" },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = criarUsuarioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senha,
    email_confirm: true,
    user_metadata: { nome: parsed.data.nome },
  })
  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Já existe um usuário cadastrado com este email"
      : createError.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { error: updateError } = await admin
    .from("usuarios")
    .update({ role: parsed.data.role, nome: parsed.data.nome })
    .eq("id", created.user.id)
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ id: created.user.id })
}
