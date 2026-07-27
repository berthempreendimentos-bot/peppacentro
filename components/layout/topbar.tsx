import { LogOut } from "lucide-react"

import { signOut } from "@/lib/actions/auth"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { NotificacoesBell } from "@/components/layout/notificacoes-bell"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function Topbar({
  nome,
  email,
  role,
}: {
  nome: string
  email: string
  role: string
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <NotificacoesBell />
        <div className="hidden text-right text-sm leading-tight sm:block">
          <div className="font-medium">{nome || email}</div>
          <div className="label-caps text-muted-foreground">{role}</div>
        </div>
        <Avatar className="size-8">
          <AvatarFallback>{initials(nome || email)}</AvatarFallback>
        </Avatar>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" title="Sair">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}
