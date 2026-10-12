import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DeliveryDraftProvider } from "@/components/admin/delivery/delivery-draft-provider";
import { DeliveryShell } from "@/components/admin/delivery/delivery-shell";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { loadAdminDeliveryContext } from "@/lib/data/admin-delivery-workspace-data";

export const metadata: Metadata = {
  title: "Entrega — Admin Directscal",
};

export default async function AdminDeliveryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await loadAdminDeliveryContext(id);

  if (!context) notFound();

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Operação", href: "/admin/operacao" },
          { label: context.delivery.companyName },
        ]}
      />
      <AppPage>
        <DeliveryDraftProvider
          key={id}
          analysis={context.analysis}
          delivery={context.delivery}
          deliveryOptions={context.deliveryOptions}
          publication={context.publication}
        >
          <DeliveryShell>{children}</DeliveryShell>
        </DeliveryDraftProvider>
      </AppPage>
    </>
  );
}
