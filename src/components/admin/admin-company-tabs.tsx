"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAppRuntime } from "@/components/app-runtime";

import { cn } from "@/lib/utils";

type CompanyTab = "overview" | "assets" | "operation" | "routines" | "action-points";

// showActionPoints liga a aba quando a empresa possui organização e a rota está disponível.
export function AdminCompanyTabs({ companyId, active, hasOrganization, showActionPoints = false, actions }: { companyId: string; active: CompanyTab; hasOrganization: boolean; showActionPoints?: boolean; actions?: ReactNode }) {
  const runtime = useAppRuntime();
  const base = `/admin/empresas/${companyId}`;
  const tabs: { key: CompanyTab; label: string; href: string }[] = [
    { key: "overview", label: "Visão geral", href: base },
    { key: "assets", label: "Arquivos", href: `${base}/criacao-dos-ativos` },
    ...(showActionPoints ? [{ key: "action-points" as const, label: "Action points", href: `${base}/action-points` }] : []),
  ];

  const nav = (
    <nav aria-label="Áreas da empresa" className={cn("flex flex-wrap gap-x-8 gap-y-3 text-sm", !actions && "border-b")}>
      {tabs.filter(tab => hasOrganization || tab.key === "overview").map(tab => (
        <Link
          key={tab.key}
          href={runtime.href(tab.href)}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 border-transparent pb-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            tab.key === "overview" && "min-w-[72px]",
            active === tab.key && "border-foreground font-semibold text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
  // Ações da aba ativa ficam na mesma linha das abas, à direita, acima da divisória.
  if (!actions) return nav;
  return <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b">{nav}<div className="flex flex-wrap gap-2 pb-2">{actions}</div></div>;
}
