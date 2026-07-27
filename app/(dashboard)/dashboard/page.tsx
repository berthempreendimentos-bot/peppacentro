import type { Metadata } from "next";

import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EvolucaoFinanceiraChart } from "@/components/dashboard/evolucao-financeira-chart";
import { GastosPorCategoriaChart } from "@/components/dashboard/gastos-categoria-chart";
import { SituacaoContratosChart } from "@/components/dashboard/situacao-contratos-chart";
import { ContratosPorClienteChart } from "@/components/dashboard/contratos-cliente-chart";

export const metadata: Metadata = {
  title: "Dashboard | PEPACORP CENTRO",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos contratos e finanças.</p>
      </div>
      <KpiCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EvolucaoFinanceiraChart />
        <GastosPorCategoriaChart />
        <SituacaoContratosChart />
        <ContratosPorClienteChart />
      </div>
    </div>
  );
}
