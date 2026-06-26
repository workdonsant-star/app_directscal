import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { PessoasConfigurationWorkspace } from "@/components/pessoas/pessoas-configuration-workspace";
import { getPeopleConfigurationWorkspace } from "@/lib/data/pessoas-data-source";

import { requirePeopleAccess } from "../access";

export const metadata: Metadata = {
  title: "Configurações — Pessoas — Directscal",
};

export default async function PessoasSettingsPage() {
  const { organizationId } = await requirePeopleAccess();
  const workspace = await getPeopleConfigurationWorkspace(organizationId);

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Pessoas", href: "/pessoas" },
          { label: "Configurações" },
        ]}
      />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <PessoasConfigurationWorkspace workspace={workspace} />
        </div>
      </main>
    </>
  );
}
