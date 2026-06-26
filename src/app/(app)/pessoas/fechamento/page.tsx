import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { PessoasClosingWorkspace } from "@/components/pessoas/pessoas-closing-workspace";
import { getPeopleMonthlyClosingWorkspace } from "@/lib/data/pessoas-data-source";

import { requirePeopleAccess } from "../access";

export const metadata: Metadata = {
  title: "Fechamento — Pessoas — Directscal",
};

export default async function PessoasClosingPage() {
  const { organizationId } = await requirePeopleAccess();
  const workspace = await getPeopleMonthlyClosingWorkspace(organizationId);

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Pessoas", href: "/pessoas" },
          { label: "Fechamento" },
        ]}
      />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <PessoasClosingWorkspace workspace={workspace} />
        </div>
      </main>
    </>
  );
}
