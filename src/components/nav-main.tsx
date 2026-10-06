"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavigationItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  disabled?: boolean;
  isActive?: boolean;
  children?: NavigationItem[];
};

export function NavMain({
  items,
  label = "Módulos",
  labelHref,
  onNavigate,
}: {
  label?: string | null;
  labelHref?: string;
  onNavigate?: () => void;
  items: NavigationItem[];
}) {
  const { state, isMobile, setOpen } = useSidebar();
  return (
    <SidebarGroup>
      {label ? (
        <SidebarGroupLabel className="text-[10px] font-normal text-muted-foreground">
          {labelHref ? <Link href={labelHref} onClick={onNavigate} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link> : label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.children ? (
              <Collapsible
                defaultOpen={item.children.some((child) => child.isActive)}
              >
                <CollapsibleTrigger
                  render={<SidebarMenuButton tooltip={item.title} />}
                  onClick={() => {
                    if (state === "collapsed" && !isMobile) setOpen(true);
                  }}
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                  <ChevronDown className="ml-auto group-data-[collapsible=icon]:hidden" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3 group-data-[collapsible=icon]:pl-0">
                  <NavMain
                    label={null}
                    items={item.children}
                    onNavigate={onNavigate}
                  />
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuButton
                aria-current={item.isActive ? "page" : undefined}
                tooltip={item.disabled ? undefined : item.title}
                disabled={item.disabled}
                isActive={item.isActive}
                render={item.url ? <Link href={item.url} /> : undefined}
                onClick={item.url ? onNavigate : undefined}
                type={item.url ? undefined : "button"}
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
