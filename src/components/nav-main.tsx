"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  label = "Módulos",
}: {
  label?: string | null;
  items: {
    title: string;
    url?: string;
    icon: LucideIcon;
    disabled?: boolean;
    isActive?: boolean;
  }[];
}) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.disabled ? undefined : item.title}
              disabled={item.disabled}
              isActive={item.isActive}
              render={item.url ? <Link href={item.url} /> : undefined}
              type={item.url ? undefined : "button"}
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
