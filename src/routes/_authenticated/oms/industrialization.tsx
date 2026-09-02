import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NpiPanel } from "@/components/oms/npi/npi-panel";
import { EquipmentPanel } from "@/components/oms/equipment/equipment-panel";
import { PfmeaPanel } from "@/components/oms/pfmea/pfmea-panel";
import { ApqpPanel } from "@/components/oms/apqp/apqp-panel";


export const Route = createFileRoute("/_authenticated/oms/industrialization")({
  head: () => ({ meta: [
    { title: "Industrialization — NPI & New Equipment | DO.Impact" },
    { name: "description", content: "Industrialization hub: AS9145 five-gate New Product Introduction and a stage-gate capital equipment validation framework from PO to handover." },
    { property: "og:title", content: "Industrialization — NPI & New Equipment | DO.Impact" },
    { property: "og:description", content: "Run new product introduction and new equipment validation on one stage-gate framework — FAT, IQ, SAT/OQ, PQ, ramp-up and handover." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: IndustrializationPage,
});

function IndustrializationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Industrialization</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Stage-gate launch frameworks in one place: New Product Introduction (AS9145) for aerospace programmes,
          APQP for automotive launches toward PPAP, and New Equipment for capital assets from purchase order to
          steady-state handover.
        </p>
      </header>

      <Tabs defaultValue="npi">
        <TabsList>
          <TabsTrigger value="npi">New Product (NPI)</TabsTrigger>
          <TabsTrigger value="apqp">APQP</TabsTrigger>
          <TabsTrigger value="pfmea">PFMEA</TabsTrigger>
          <TabsTrigger value="equipment">New Equipment</TabsTrigger>
        </TabsList>
        <TabsContent value="npi" className="pt-4"><NpiPanel /></TabsContent>
        <TabsContent value="apqp" className="pt-4"><ApqpPanel /></TabsContent>
        <TabsContent value="pfmea" className="pt-4"><PfmeaPanel /></TabsContent>
        <TabsContent value="equipment" className="pt-4"><EquipmentPanel /></TabsContent>
      </Tabs>

    </div>
  );
}
