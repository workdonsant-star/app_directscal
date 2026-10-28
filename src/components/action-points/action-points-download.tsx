"use client";

import { Download } from "lucide-react";
import { useAppRuntime } from "@/components/app-runtime";
import { Button } from "@/components/ui/button";

export function ActionPointsDownload({ diagnosticId }: { diagnosticId: string }) {
  const runtime = useAppRuntime();

  return (
    <Button
      size="sm"
      nativeButton={false}
      render={<a href={runtime.href(`/omdx/${diagnosticId}/action-points`)} download />}
    >
      <Download aria-hidden="true" className="size-4" />
      Baixar Action Points
    </Button>
  );
}
