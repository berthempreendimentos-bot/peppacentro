import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      { error: "Apenas administradores podem excluir usuários" },
      { status: 403 }
    )
  }

  if (id === user.id) {
    return NextResponse.json(
      { error: "Você não pode excluir o próprio usuário" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
