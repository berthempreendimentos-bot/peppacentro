import type { Metadata } from "next";

import { CentroCustosList } from "@/components/centro-custos/centro-custos-list";
import { CategoriasList } from "@/components/centro-custos/categorias-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Centro de Custos | PEPACORP CENTRO",
};

export default function CentroCustosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Centro de Custos</h1>
        <p className="text-muted-foreground">
          Centros de custo e categorias usados para classificar os lançamentos financeiros.
        </p>
      </div>
      <Tabs defaultValue="centro-custos">
        <TabsList>
          <TabsTrigger value="centro-custos">Centros de Custo</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="centro-custos">
          <CentroCustosList />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriasList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
