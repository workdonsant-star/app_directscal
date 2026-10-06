"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AppTopbarProps = {
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
};

export function AppTopbar({ breadcrumb = [], actions }: AppTopbarProps) {
<<<<<<< Updated upstream
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex h-full min-w-0 flex-1 items-center gap-4 px-4">
=======
  const pathname = usePathname();
  const title =
    pathname === "/omdx"
      ? "Analytics"
      : pathname === "/omdx/diagnosticos"
        ? "Pesquisas"
        : pathname === "/relatorios"
          ? "Diagnósticos"
        : pathname === "/assistente"
          ? "Agente"
          : pathname === "/gantt"
            ? "Action Points"
            : pathname === "/iniciativas"
              ? "Iniciativas"
              : null;
  return (
    <header
      data-slot="app-topbar"
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-shell"
    >
      <div className="flex h-full min-w-0 flex-1 items-center gap-4 px-6 lg:px-10">
>>>>>>> Stashed changes
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1 self-center" />
          {breadcrumb.length > 0 ? (
            <Separator
              orientation="vertical"
              className="mr-2 self-center data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />
          ) : null}

          {breadcrumb.length > 0 && (
            <Breadcrumb className="flex min-w-0 items-center">
              <BreadcrumbList className="min-h-8 items-center leading-none">
                {breadcrumb.map((item, index) => {
                  const isLast = index === breadcrumb.length - 1;

                  return (
                    <Fragment key={`${item.label}-${index}`}>
                      <BreadcrumbItem className="h-8 items-center">
                        {isLast ? (
                          <BreadcrumbPage className="inline-flex h-8 items-center">
                            {item.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            className="inline-flex h-8 items-center"
                            render={
                              item.href ? <Link href={item.href} /> : undefined
                            }
                          >
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="flex h-8 items-center" />
                      )}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
          <div
            data-slot="app-topbar-actions"
            className="flex min-w-0 items-center justify-end gap-2"
          >
            {actions}
          </div>

          <Button variant="ghost" size="icon" aria-label="Alertas">
            <Bell className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
