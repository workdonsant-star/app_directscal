import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { PessoasOverview } from "@/components/pessoas/pessoas-overview";
import { getPeopleOverviewWorkspace } from "@/lib/data/pessoas-data-source";

import { requirePeopleAccess } from "./access";

export const metadata: Metadata = {
  title: "Pessoas — Directscal",
};

export default async function PessoasPage() {
  const { organizationId } = await requirePeopleAccess();
  const workspace = await getPeopleOverviewWorkspace(organizationId);

  return (
    <>
      <AppTopbar />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <PessoasOverview workspace={workspace} />
        </div>
      </main>
    </>
  );
}
