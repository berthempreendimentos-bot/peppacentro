"use client"

import Link from "next/link"
import { Bell, CalendarClock, FileWarning, ClipboardX, Wallet } from "lucide-react"

import { useMarcarNotificacaoLida, useNotificacoes } from "@/lib/queries/notificacoes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

const tipoConfig: Record<string, { label: string; icon: React.ElementType }> = {
  contrato_vencendo: { label: "Contrato vencendo", icon: CalendarClock },
  documento_vencido: { label: "Documento vencido", icon: FileWarning },
  documento_vencendo: { label: "Documento vencendo", icon: FileWarning },
  medicao_atrasada: { label: "Medição atrasada", icon: ClipboardX },
  pagamento_atrasado: { label: "Pagamento atrasado", icon: Wallet },
}

export function NotificacoesBell() {
  const { data: notificacoes, isLoading } = useNotificacoes()
  const marcarLida = useMarcarNotificacaoLida()

  const naoLidas = notificacoes?.filter((n) => !n.lida) ?? []

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {naoLidas.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {naoLidas.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b p-3">
          <p className="font-medium">Notificações</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!isLoading && notificacoes?.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação no momento.
            </p>
          )}
          {notificacoes?.map((n) => {
            const config = tipoConfig[n.tipo] ?? { label: n.tipo, icon: Bell }
            const Icon = config.icon
            return (
              <Link
                key={n.chave}
                href={`/contratos/${n.contrato_id}`}
                onClick={() => !n.lida && marcarLida.mutate(n.chave)}
                className={`flex gap-3 border-b p-3 text-sm last:border-b-0 hover:bg-muted/50 ${
                  n.lida ? "opacity-60" : ""
                }`}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {config.label}
                  </span>
                  <span>{n.mensagem}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
