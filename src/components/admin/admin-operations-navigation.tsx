import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminOperationsNavigation({
  section,
}: {
  section: "deliveries" | "assets";
}) {
  return (
    <nav aria-label="Áreas da operação" className="flex flex-wrap gap-2 border-b pb-4">
      <Button
        nativeButton={false}
        variant={section === "deliveries" ? "secondary" : "ghost"}
        render={<Link href="/admin/operacao" aria-current={section === "deliveries" ? "page" : undefined} />}
      >
        Entregas
      </Button>
      <Button
        nativeButton={false}
        variant={section === "assets" ? "secondary" : "ghost"}
        render={<Link href="/admin/operacao/criacao-dos-ativos" aria-current={section === "assets" ? "page" : undefined} />}
      >
        Criação dos ativos
      </Button>
    </nav>
  );
}
