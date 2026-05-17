import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "../../../../../auth";
import { AcquisitionGoogleCompleteFlow } from "@/components/admin/acquisition-google-complete-flow";
import { authUserSchema } from "@/lib/contracts";
import {
  acquisitionOauthIntentCookieName,
  getAcquisitionOauthIntent,
} from "@/lib/data/acquisition-data-source";
import { getAdminModuleById } from "@/lib/data/admin-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Completar acesso — Directscal",
};

type AcquisitionCompletePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AcquisitionCompletePage({
  params,
}: AcquisitionCompletePageProps) {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const session = await auth();
  const cookieStore = await cookies();
  const intent = await getAcquisitionOauthIntent(
    cookieStore.get(acquisitionOauthIntentCookieName)?.value,
  );

  if (!intent || intent.campaign.slug !== slug) {
    redirect(`/a/${slug}`);
  }

  if (!session?.user || session.acquisition !== true) {
    redirect(`/a/${slug}`);
  }

  const parsedUser = authUserSchema.safeParse(session.user);

  if (!parsedUser.success) {
    redirect(`/a/${slug}`);
  }

  const campaign = intent.campaign;
  const selectedModule = campaign ? getAdminModuleById(campaign.moduleId) : null;

  return (
    <AcquisitionGoogleCompleteFlow
      campaign={campaign}
      selectedModule={selectedModule}
      slug={slug}
      user={parsedUser.data}
    />
  );
}
