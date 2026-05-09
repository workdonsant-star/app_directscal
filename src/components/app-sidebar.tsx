"use client";

import {
  ClipboardList,
  Compass,
  FileText,
  GitBranch,
  MessageSquare,
  ListChecks,
  ShieldCheck,
  Target,
  Telescope,
  UserCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { AppSwitcher } from "@/components/app-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Daniel Santos",
    email: "work.donsant@gmail.com",
    initials: "DS",
  },
  modules: [
    { title: "OMDx", url: "/omdx", icon: ClipboardList, exact: true },
    { title: "Diagnósticos", url: "/omdx/diagnosticos", icon: ListChecks },
  ],
  insights: [
    { name: "Cultura", url: "/insights/cultura", icon: ShieldCheck },
    { name: "Visão", url: "/insights/visao", icon: Telescope },
    { name: "Comunicação", url: "/insights/comunicacao", icon: MessageSquare },
    { name: "Processos", url: "/insights/processos", icon: GitBranch },
    { name: "Liderança", url: "/insights/lideranca", icon: UserCheck },
    { name: "Performance", url: "/insights/performance", icon: Target },
  ],
  resources: [
    { name: "Metodologia", url: "/metodologia", icon: Compass },
    { name: "Documentação", url: "/docs", icon: FileText },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const modules = data.modules.map((item) => ({
    ...item,
    isActive: item.exact
      ? pathname === item.url
      : pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));
  const insights = data.insights.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));
  const resources = data.resources.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AppSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={modules} />
        <NavProjects label="Insights" projects={insights} />
        <NavProjects hideWhenCollapsed projects={resources} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
