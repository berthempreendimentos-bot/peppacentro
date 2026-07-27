import { z } from "zod"

export const userRoleValues = [
  "admin",
  "gestor",
  "financeiro",
  "fiscal",
  "visualizador",
] as const

export const criarUsuarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  role: z.enum(userRoleValues),
})

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>
