"use client";

import { Globe, FlaskConical, Plus, Smartphone, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInitiatives, type Initiative } from "@/lib/initiatives/storage";

export const initiativeIcons = {
  website: Globe,
  oferta: Tag,
  aplicativo: Smartphone,
  teste: FlaskConical,
};
const iconColors = {
  website: "text-initiative-website",
  oferta: "text-chart-positive",
  aplicativo: "text-initiative-app",
  teste: "text-primary",
};

export function InitiativeNavigation({
  scope,
  onNavigate,
}: {
  scope: string;
  onNavigate: () => void;
}) {
  const { initiatives } = useInitiatives(scope);
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="justify-between text-[10px] font-normal text-muted-foreground">
        <Link
          href="/iniciativas"
          onClick={onNavigate}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Iniciativas
        </Link>
        <Link
          href="/iniciativas"
          aria-label="Gerenciar iniciativas"
          onClick={onNavigate}
          className="flex size-5 items-center justify-center rounded-sm hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3" />
        </Link>
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {initiatives.map((item: Initiative) => {
          const Icon = initiativeIcons[item.kind];
          const href = `/iniciativas/${item.id}`;
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                tooltip={item.title}
                render={<Link href={href} />}
                isActive={pathname === href}
                aria-current={pathname === href ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon className={iconColors[item.kind]} />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
        {initiatives.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Criar iniciativa"
              render={<Link href="/iniciativas" />}
              onClick={onNavigate}
            >
              <Plus />
              <span>Criar iniciativa</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}
      </SidebarMenu>
    </SidebarGroup>
  );
}
