"use client";

import {
  Blocks,
  Building2,
  CalendarDays,
  Eye,
  Flag,
  LayoutGrid,
  Megaphone,
  MessageSquareText,
  SquarePlus,
  Sprout,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
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
    company: "Directscal",
    initials: "DS",
    role: "admin" as const,
  },
  appModules: [
    {
      id: "module_omdx",
      title: "Maturidade",
      subtitle: "Diagnóstico operacional",
      url: "/omdx",
      icon: Blocks,
    },
  ],
  omdxItems: [
    { title: "Diagnósticos", url: "/omdx/diagnosticos", icon: SquarePlus },
    { title: "Cronograma", url: "/gantt", icon: CalendarDays },
  ],
  admin: [
    { title: "Módulos", url: "/admin/modulos", icon: LayoutGrid },
    { title: "Campanhas", url: "/admin/campanhas", icon: Megaphone },
    { title: "Leads", url: "/admin/leads", icon: Users },
    { title: "Empresas", url: "/admin/empresas", icon: Building2 },
  ],
  insights: [
    { name: "Cultura", url: "/insights/cultura", icon: Sprout },
    { name: "Visão", url: "/insights/visao", icon: Eye },
    { name: "Comunicação", url: "/insights/comunicacao", icon: MessageSquareText },
    { name: "Processos", url: "/insights/processos", icon: Workflow },
    { name: "Liderança", url: "/insights/lideranca", icon: Flag },
    { name: "Performance", url: "/insights/performance", icon: Zap },
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
    company: string;
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
        pathname === "/omdx" ||
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
  const primaryNavigation = [
    ...appModules.map((module) => ({
      ...module,
      isActive: pathname === module.url,
    })),
    ...data.omdxItems.map((item) => ({
      ...item,
      isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
    })),
  ];
  const dimensionNavigation = data.insights.map((item) => ({
    title: item.name,
    url: item.url,
    icon: item.icon,
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
      <SidebarHeader className="pb-4">
        <NavUser user={sidebarUser} />
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <NavMain label="Administração" items={admin} />
        ) : (
          <>
            <NavMain label={null} items={primaryNavigation} />
            <NavMain label="Dimensões" items={dimensionNavigation} />
          </>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
