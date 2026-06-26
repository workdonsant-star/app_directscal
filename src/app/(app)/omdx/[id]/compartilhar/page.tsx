import type { Metadata } from "next";
import Link from "next/link";

import { AppTopbar } from "@/components/app-topbar";
import { ShareWorkspace } from "@/components/omdx/share-workspace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDiagnosticShareWorkspace } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Compartilhar diagnóstico — Maturidade",
};

type ShareDiagnosticPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShareDiagnosticPage({
  params,
}: ShareDiagnosticPageProps) {
  const { id } = await params;
  const workspace = await getDiagnosticShareWorkspace(id);

  if (!workspace) {
    return (
      <>
        <AppTopbar
          breadcrumb={[
            { label: "Maturidade", href: "/omdx" },
            { label: "Diagnósticos", href: "/omdx/diagnosticos" },
            { label: "Compartilhar" },
          ]}
        />

        <main className="flex flex-1 items-center justify-center p-6 lg:p-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Diagnóstico não encontrado</CardTitle>
              <CardDescription>
                O diagnóstico solicitado não existe no banco ou os links de
                coleta ainda não foram gerados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                nativeButton={false}
                render={<Link href="/omdx/diagnosticos" />}
              >
                Voltar para diagnósticos
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Maturidade", href: "/omdx" },
          { label: "Diagnósticos", href: "/omdx/diagnosticos" },
          { label: "Compartilhar" },
        ]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <ShareWorkspace
            diagnostic={workspace.diagnostic}
            links={workspace.links}
          />
        </div>
      </main>
    </>
  );
}
