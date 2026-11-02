"use client";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";

export default function Error({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <>
      <AppTopbar />
      <AppPage>
        <div role="alert" className="flex flex-col items-start gap-3">
          <h2 className="text-ui-title">Não foi possível carregar as informações</h2>
          <p className="text-sm text-muted-foreground">Tente novamente para consultar os dados atualizados.</p>
          <Button variant="outline" onClick={unstable_retry}>Tentar novamente</Button>
        </div>
      </AppPage>
    </>
  );
}
