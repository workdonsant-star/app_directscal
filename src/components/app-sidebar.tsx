"use client";

import {
  Building2,
  FileText,
  LayoutGrid,
  Megaphone,
  ScanEye,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavModules } from "@/components/nav-modules";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    id: "user_daniel",
    name: "Daniel Santos",
    email: "work.donsant@gmail.com",
    initials: "DS",
    role: "admin" as const,
  },
  appModules: [
    {
      id: "module_omdx",
      title: "Maturidade",
      subtitle: "Diagnóstico operacional",
      url: "/omdx",
      icon: ScanEye,
    },
    {
      id: "module_people",
      title: "Pessoas",
      subtitle: "Vínculos, custos e fechamento",
      url: "/pessoas",
      icon: Users,
    },
  ],
  omdxItems: [
    { title: "Overview", url: "/omdx", exact: true },
    { title: "Diagnósticos", url: "/omdx/diagnosticos" },
    { title: "Cronograma", url: "/gantt" },
  ],
  peopleItems: [
    { title: "Overview", url: "/pessoas", exact: true },
    { title: "Diretório", url: "/pessoas/diretorio" },
    { title: "Fechamento", url: "/pessoas/fechamento" },
    { title: "Configurações", url: "/pessoas/configuracoes" },
  ],
  admin: [
    { title: "Módulos", url: "/admin/modulos", icon: LayoutGrid },
    { title: "Campanhas", url: "/admin/campanhas", icon: Megaphone },
    { title: "Leads", url: "/admin/leads", icon: Users },
    { title: "Empresas", url: "/admin/empresas", icon: Building2 },
  ],
  insights: [
    { name: "Cultura", url: "/insights/cultura" },
    { name: "Visão", url: "/insights/visao" },
    { name: "Comunicação", url: "/insights/comunicacao" },
    { name: "Processos", url: "/insights/processos" },
    { name: "Liderança", url: "/insights/lideranca" },
    { name: "Performance", url: "/insights/performance" },
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
  acquisitionEnabled = false,
  enabledModuleIds,
  user = data.user,
}: {
  acquisitionEnabled?: boolean;
  enabledModuleIds?: string[];
  user?: {
    avatar?: string;
    email: string;
    id: string;
    initials?: string;
    name: string;
    role?: "superadmin" | "admin" | "cliente";
  };
}) {
  const pathname = usePathname();
  const sidebarUser = {
    ...user,
    initials: user.initials ?? (getInitials(user.name) || "DS"),
  };
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const enabledModuleSet = enabledModuleIds
    ? new Set(enabledModuleIds)
    : null;
  const enabledAppModules = data.appModules
    .filter((module) => {
      return !enabledModuleSet || enabledModuleSet.has(module.id);
    })
    .map((module) => ({
      ...module,
      isActive:
        module.id === "module_people"
          ? pathname === "/pessoas" || pathname.startsWith("/pessoas/")
          : pathname === "/omdx" ||
            pathname.startsWith("/omdx/") ||
            pathname === "/gantt" ||
            pathname.startsWith("/gantt/") ||
            pathname === "/insights" ||
            pathname.startsWith("/insights/"),
    }));
  const appModules =
    enabledAppModules.length > 0
      ? enabledAppModules
      : data.appModules.slice(0, 1).map((module) => ({
          ...module,
          isActive: true,
        }));
  const appNavigationModules = appModules.map((module) => {
    const items =
      module.id === "module_people"
        ? data.peopleItems
        : [
            ...data.omdxItems,
            ...data.insights.map((item) => ({
              title: item.name,
              url: item.url,
            })),
          ];

    return {
      ...module,
      items: items.map((item) => ({
        ...item,
        isActive: "exact" in item && item.exact
          ? pathname === item.url
          : pathname === item.url || pathname.startsWith(`${item.url}/`),
      })),
    };
  });
  const resources = data.resources.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));
  const adminItems = acquisitionEnabled ? data.admin : data.admin.slice(0, 1);
  const admin = adminItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));

  return (
    <Sidebar
      collapsible="icon"
      className="[&_[data-slot=sidebar-inner]]:bg-sidebar"
    >
      <SidebarHeader>
        <NavUser user={sidebarUser} />
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <NavMain label="Administração" items={admin} />
        ) : (
          <>
            <NavModules modules={appNavigationModules} />
            <NavProjects hideWhenCollapsed projects={resources} />
          </>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
