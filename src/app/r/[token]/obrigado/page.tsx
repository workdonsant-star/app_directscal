import type { Metadata } from "next";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Obrigado — OMDx",
};

export default function PublicResponseThankYouPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Image
              src="/directscal-logo.svg"
              alt="Directscal"
              width={132}
              height={28}
              priority
              className="dark:hidden"
              style={{ height: "auto", width: "132px" }}
            />
            <Image
              src="/directscal-logo-dark.svg"
              alt="Directscal"
              width={132}
              height={28}
              priority
              className="hidden dark:block"
              style={{ height: "auto", width: "132px" }}
            />
          </div>
          <Badge variant="outline">OMDx</Badge>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Obrigado</CardTitle>
            <CardDescription>Sua resposta foi registrada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              As respostas são analisadas de forma consolidada por grupo, sem
              identificação pessoal.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Você já pode fechar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
