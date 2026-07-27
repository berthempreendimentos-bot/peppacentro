import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  FolderOpen,
  CalendarClock,
  ClipboardList,
  Building2,
  Tags,
  BarChart3,
} from "lucide-react"

export const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Documentos", url: "/documentos", icon: FolderOpen },
  { title: "Cronograma", url: "/cronograma", icon: CalendarClock },
  { title: "Medições", url: "/medicoes", icon: ClipboardList },
  { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
  { title: "Centro de Custos", url: "/centro-custos", icon: Tags },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
] as const
