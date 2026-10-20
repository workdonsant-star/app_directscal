import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPdfDownload({ href }: { href: string }) {
  return (
    <Button variant="secondary" nativeButton={false} render={<a href={href} download />}>
      <Download aria-hidden="true" className="size-4" />
      Baixar PDF
    </Button>
  );
}
