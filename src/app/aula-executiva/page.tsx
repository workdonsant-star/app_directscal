import type { Metadata } from "next";

import { ExecutiveClassLanding } from "@/components/marketing/executive-class-landing";

export const metadata: Metadata = {
  title: "Sua empresa ainda depende de você? | Directscal",
  description:
    "Aula executiva de 45 minutos sobre os gargalos de gestão que mantêm decisões, problemas e alinhamentos concentrados no fundador.",
};

export default function ExecutiveClassPage() {
  const registrationUrl =
    process.env.NEXT_PUBLIC_EXECUTIVE_CLASS_REGISTRATION_URL ?? "/a/omdx-site";

  return <ExecutiveClassLanding registrationUrl={registrationUrl} />;
}

