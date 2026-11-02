"use client";

import { useState } from "react";
import { useAppRuntime } from "@/components/app-runtime";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";

export function CustomerDocumentDownloadLink({ document }: { document: CustomerDocument }) {
  const runtime = useAppRuntime();
  const [error, setError] = useState(false);

  async function download() {
    setError(false);
    try {
      const response = await runtime.request(`/api/customer-documents/${document.id}`);
      if (!response.ok) throw new Error("download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError(true); }
  }

  return <><button type="button" onClick={download} className="block max-w-full truncate text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring">{document.title}</button>{error ? <span role="alert" className="text-xs text-destructive">Não foi possível baixar o arquivo.</span> : null}</>;
}
