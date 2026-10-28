import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPdfDownload({ href }: { href: string }) {
  const dataHref = `${href}${href.includes("?") ? "&" : "?"}conteudo=dados`;

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" nativeButton={false} render={<a href={href} download aria-label="Baixar relatório de diagnóstico em PDF" />}>
        <Download aria-hidden="true" className="size-4" />
        Relatório (PDF)
      </Button>
      <Button variant="secondary" nativeButton={false} render={<a href={dataHref} download aria-label="Baixar dados da pesquisa em PDF" />}>
        <FileSpreadsheet aria-hidden="true" className="size-4" />
        Dados (PDF)
      </Button>
    </div>
  );
}
