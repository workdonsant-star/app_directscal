"use client";

import { Bell, HelpCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

type AppTopbarProps = {
  breadcrumb?: { label: string; href?: string }[];
};

export function AppTopbar({ breadcrumb = [] }: AppTopbarProps) {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      {breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          {breadcrumb.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && (
                <span className="text-muted-foreground">/</span>
              )}
              <span
                className={
                  idx === breadcrumb.length - 1
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {item.label}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-1">
        <div className="relative hidden md:block">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Buscar"
            className="bg-muted/50 h-8 w-56 border-transparent pl-8 text-sm"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="Ajuda">
          <HelpCircle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
