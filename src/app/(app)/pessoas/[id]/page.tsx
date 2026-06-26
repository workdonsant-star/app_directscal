import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { PessoasProfile } from "@/components/pessoas/pessoas-profile";
import { getPeopleProfileWorkspace } from "@/lib/data/pessoas-data-source";

import { requirePeopleAccess } from "../access";

type PessoasProfilePageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Perfil — Pessoas — Directscal",
};

export default async function PessoasProfilePage({
  params,
}: PessoasProfilePageProps) {
  const { id } = await params;
  const { organizationId } = await requirePeopleAccess();
  const workspace = await getPeopleProfileWorkspace({
    organizationId,
    personId: id,
  });

  if (!workspace) {
    notFound();
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Pessoas", href: "/pessoas" },
          { label: "Diretório", href: "/pessoas/diretorio" },
          { label: workspace.person.name },
        ]}
      />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <PessoasProfile person={workspace.person} />
        </div>
      </main>
    </>
  );
}
