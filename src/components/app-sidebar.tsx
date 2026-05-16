"use client";

import {
  Binoculars,
  Building2,
  FileText,
  GitBranch,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  ListChecks,
  ShieldCheck,
  Target,
  Telescope,
  UserCheck,
  Users,
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
    { title: "Overview", url: "/omdx", icon: Binoculars, exact: true },
    { title: "Diagnósticos", url: "/omdx/diagnosticos", icon: ListChecks },
  ],
  admin: [
    { title: "Módulos", url: "/admin/modulos", icon: LayoutGrid },
    { title: "Campanhas", url: "/admin/campanhas", icon: Megaphone },
    { title: "Leads", url: "/admin/leads", icon: Users },
    { title: "Empresas", url: "/admin/empresas", icon: Building2 },
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
    { name: "Documentação", url: "/docs", icon: FileText },
  ],
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppSidebar({
  user = data.user,
}: {
  user?: {
    avatar?: string;
    email: string;
    initials?: string;
    name: string;
  };
}) {
  const pathname = usePathname();
  const sidebarUser = {
    ...user,
    initials: user.initials ?? (getInitials(user.name) || "DS"),
  };
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
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
  const admin = data.admin.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));

  return (
    <Sidebar
      collapsible="icon"
      className="[&_[data-slot=sidebar-inner]]:bg-background"
    >
      <SidebarHeader>
        <AppSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <NavMain label="Administração" items={admin} />
        ) : (
          <>
            <NavMain items={modules} />
            <NavProjects label="Insights" projects={insights} />
            <NavProjects hideWhenCollapsed projects={resources} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
