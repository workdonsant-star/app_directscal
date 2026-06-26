"use client";

import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

type NavModuleLeafItem = {
  exact?: boolean;
  isActive?: boolean;
  description?: string;
  title: string;
  url: string;
};

type NavModuleCategoryItem = {
  isActive?: boolean;
  items: NavModuleLeafItem[];
  title: string;
  type: "category";
};

type NavModuleItem = NavModuleLeafItem | NavModuleCategoryItem;

type NavModule = {
  icon: LucideIcon;
  isActive?: boolean;
  items: NavModuleItem[];
  title: string;
};

const smoothRevealEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

function isNavModuleCategory(
  item: NavModuleItem,
): item is NavModuleCategoryItem {
  return "type" in item && item.type === "category";
}

export function NavModules({
  modules,
}: {
  modules: NavModule[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Módulos</SidebarGroupLabel>
      <SidebarMenu>
        {modules.map((module) => (
          <NavModuleRow key={module.title} module={module} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavModuleRow({ module }: { module: NavModule }) {
  const [open, setOpen] = useState(Boolean(module.isActive));
  const shouldReduceMotion = useReducedMotion();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
  }

  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: smoothRevealEase };
  const listTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delayChildren: 0.04, staggerChildren: 0.04 };
  const itemTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: smoothRevealEase };

  return (
    <Collapsible
      className="group/collapsible"
      onOpenChange={handleOpenChange}
      open={open}
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            className="h-8 rounded-md data-active:bg-sidebar-accent/70 data-active:font-normal data-open:bg-sidebar-accent/70"
            isActive={module.isActive}
            tooltip={module.title}
          />
        }
      >
        <module.icon className="size-4" />
        <span>{module.title}</span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          className="ml-auto flex size-4 items-center justify-center text-muted-foreground group-data-[collapsible=icon]:hidden"
          transition={itemTransition}
        >
          <ChevronRight className="size-3.5" />
        </motion.span>
      </CollapsibleTrigger>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={panelTransition}
          >
            <motion.ul
              animate="open"
              className="mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-1 group-data-[collapsible=icon]:hidden"
              data-sidebar="menu-sub"
              data-slot="sidebar-menu-sub"
              exit="closed"
              initial="closed"
              transition={listTransition}
              variants={{
                closed: {},
                open: {},
              }}
            >
              {module.items.map((item) => (
                isNavModuleCategory(item) ? (
                  <motion.li
                    className="min-w-0"
                    data-sidebar="menu-sub-item"
                    data-slot="sidebar-menu-sub-item"
                    key={`${module.title}-${item.title}`}
                    transition={itemTransition}
                    variants={{
                      closed: {
                        opacity: 0,
                        y: shouldReduceMotion ? 0 : -5,
                      },
                      open: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                  >
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {item.title}
                    </p>
                    <ul className="flex min-w-0 flex-col gap-1">
                      {item.items.map((child) => (
                        <li
                          className="group/menu-sub-item relative rounded-md transition-colors duration-150 before:absolute before:-left-[11px] before:top-1 before:h-6 before:w-px before:bg-sidebar-ring before:opacity-0 before:transition-opacity before:duration-150 hover:bg-sidebar-accent hover:before:opacity-70"
                          data-sidebar="menu-sub-item"
                          data-slot="sidebar-menu-sub-item"
                          key={`${module.title}-${item.title}-${child.title}`}
                        >
                          <SidebarMenuSubButton
                            className="h-auto min-h-8 w-full cursor-pointer rounded-md px-2 py-1.5 font-normal transition-colors duration-150 data-active:bg-sidebar-accent data-active:font-normal data-active:text-sidebar-foreground group-hover/menu-sub-item:bg-sidebar-accent hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            isActive={child.isActive}
                            render={<Link href={child.url} />}
                          >
                            <span className="truncate">{child.title}</span>
                          </SidebarMenuSubButton>
                        </li>
                      ))}
                    </ul>
                  </motion.li>
                ) : (
                  <motion.li
                    className="group/menu-sub-item relative rounded-md transition-colors duration-150 before:absolute before:-left-[11px] before:top-1 before:h-6 before:w-px before:bg-sidebar-ring before:opacity-0 before:transition-opacity before:duration-150 hover:bg-sidebar-accent hover:before:opacity-70"
                    data-sidebar="menu-sub-item"
                    data-slot="sidebar-menu-sub-item"
                    key={`${module.title}-${item.title}`}
                    transition={itemTransition}
                    variants={{
                      closed: {
                        opacity: 0,
                        y: shouldReduceMotion ? 0 : -5,
                      },
                      open: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                  >
                    <SidebarMenuSubButton
                      className="h-8 w-full cursor-pointer rounded-md px-2 font-normal transition-colors duration-150 data-active:bg-sidebar-accent data-active:font-normal data-active:text-sidebar-foreground group-hover/menu-sub-item:bg-sidebar-accent hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      isActive={item.isActive}
                      render={<Link href={item.url} />}
                    >
                      <span>{item.title}</span>
                    </SidebarMenuSubButton>
                  </motion.li>
                )
              ))}
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Collapsible>
  );
}
