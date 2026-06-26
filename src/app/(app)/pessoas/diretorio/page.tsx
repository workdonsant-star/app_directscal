import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { PessoasDirectoryWorkspace } from "@/components/pessoas/pessoas-directory-workspace";
import { getCurrentOperationalOnboardingWorkspace } from "@/lib/data/operational-onboarding-data-source";
import { getPeopleDirectoryWorkspace } from "@/lib/data/pessoas-data-source";

import { requirePeopleAccess } from "../access";

export const metadata: Metadata = {
  title: "Diretório — Pessoas — Directscal",
};

export default async function PessoasDirectoryPage() {
  const { organizationId } = await requirePeopleAccess();
  const [workspace, onboardingWorkspace] = await Promise.all([
    getPeopleDirectoryWorkspace(organizationId),
    getCurrentOperationalOnboardingWorkspace(),
  ]);
  const registrationLink = onboardingWorkspace
    ? {
        previewPath: onboardingWorkspace.previewPath,
        publicUrl: onboardingWorkspace.publicUrl,
      }
    : null;

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Pessoas", href: "/pessoas" }, { label: "Diretório" }]} />
      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <PessoasDirectoryWorkspace
            registrationLink={registrationLink}
            workspace={workspace}
          />
        </div>
      </main>
    </>
  );
}
