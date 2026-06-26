"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type AppSwitcherModule = {
  icon: LucideIcon;
  id: string;
  isActive: boolean;
  subtitle: string;
  title: string;
  url: string;
};

export function AppSwitcher({ modules }: { modules: AppSwitcherModule[] }) {
  const { isMobile } = useSidebar();
  const activeModule = modules.find((module) => module.isActive) ?? modules[0];
  const ActiveIcon = activeModule.icon;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-muted"
                aria-label="Selecionar módulo"
              />
            }
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <ActiveIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeModule.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                {activeModule.subtitle}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            {modules.map((module) => {
              const ModuleIcon = module.icon;

              return (
                <DropdownMenuItem
                  key={module.id}
                  render={<Link href={module.url} />}
                  className="cursor-pointer p-0 focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm">
                    <div className="flex size-8 items-center justify-center rounded-lg border bg-background text-foreground">
                      <ModuleIcon className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {module.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {module.subtitle}
                      </span>
                    </div>
                    {module.isActive && <Check className="size-4" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
