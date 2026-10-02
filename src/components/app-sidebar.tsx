"use client";

import {
  Blocks,
  Bot,
  BookOpenCheck,
  BookText,
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  ClipboardCheck,
  Eye,
  FileText,
  Flag,
  GitBranch,
  Megaphone,
  MessageSquareText,
  Scale,
  Settings,
  SquarePlus,
  Sprout,
  UserRoundCheck,
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
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const data = {
  user: {
    id: "user_daniel",
    name: "Daniel Santos",
    company: "Directscal",
    initials: "DS",
    role: "cliente" as const,
  },
  appModules: [
    {
      id: "module_omdx",
      title: "Overview",
      subtitle: "Diagnóstico operacional",
      url: "/omdx",
      icon: Blocks,
    },
  ],
  omdxItems: [
    { title: "Coletas", url: "/omdx/diagnosticos", icon: SquarePlus },
    { title: "Action Points", url: "/gantt", icon: CalendarDays },
    { title: "WorkFlow", url: "/assistente", icon: Bot },
  ],
  admin: [
    {
      title: "Operação",
      url: "/admin/operacao",
      icon: ClipboardCheck,
      requiresAcquisition: false,
    },
    {
      title: "Especialistas",
      url: "/admin/especialistas",
      icon: UserRoundCheck,
      requiresAcquisition: false,
    },
    {
      title: "Ativos de gestão",
      url: "/admin/ativos",
      icon: BookOpenCheck,
      requiresAcquisition: false,
    },
    {
      title: "Empresas",
      url: "/admin/empresas",
      icon: Building2,
      requiresAcquisition: true,
    },
    {
      title: "Leads",
      url: "/admin/leads",
      icon: Users,
      requiresAcquisition: true,
    },
    {
      title: "Campanhas",
      url: "/admin/campanhas",
      icon: Megaphone,
      requiresAcquisition: true,
    },
  ],
  insights: [
    { name: "Cultura", url: "/insights/cultura", icon: Sprout },
    { name: "Visão", url: "/insights/visao", icon: Eye },
    { name: "Comunicação", url: "/insights/comunicacao", icon: MessageSquareText },
    { name: "Processos", url: "/insights/processos", icon: Workflow },
    { name: "Liderança", url: "/insights/lideranca", icon: Flag },
    { name: "Performance", url: "/insights/performance", icon: Zap },
  ],
  managementAssets: [
    { title: "SOPs", url: "/ativos-de-gestao/sops", icon: BookOpenCheck },
    {
      title: "Playbooks",
      url: "/ativos-de-gestao/playbooks",
      icon: BookText,
    },
    {
      title: "Governança",
      url: "/ativos-de-gestao/governanca",
      icon: Scale,
    },
    {
      title: "Matriz RACI",
      url: "/ativos-de-gestao/matriz-raci",
      icon: GitBranch,
    },
  ],
  documents: [
    { title: "Contratos", icon: FileText, disabled: true },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: ChartNoAxesColumn,
    },
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
  const { isCompact, setOpen } = useSidebar();
  const closeCompactSidebar = () => {
    if (isCompact) {
      setOpen(false);
    }
  };
  const sidebarUser = {
    ...user,
    initials: user.initials ?? (getInitials(user.name) || "DS"),
  };
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isOrganizationAdmin = user.role === "admin";
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
  const managementAssetNavigation = data.managementAssets.map((item) => ({
    ...item,
    isActive:
      pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));
  const documentNavigation = data.documents
    .filter((item) => !isOrganizationAdmin || item.title !== "Contratos")
    .map((item) => ({
      ...item,
      isActive:
        item.url !== undefined &&
        (pathname === item.url || pathname.startsWith(`${item.url}/`)),
    }));
  const settingsNavigation = isOrganizationAdmin ? [] : [
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings,
      isActive:
        pathname === "/configuracoes" ||
        pathname.startsWith("/configuracoes/"),
    },
  ];
  const adminItems = acquisitionEnabled
    ? data.admin
    : data.admin.filter((item) => !item.requiresAcquisition);
  const admin = adminItems.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
  }));

  return (
    <Sidebar
      collapsible="icon"
      className="[&_[data-slot=sidebar-inner]]:bg-sidebar [&_[data-slot=sidebar-container]]:border-r-0"
    >
      <SidebarHeader className="pb-4">
        <NavUser user={sidebarUser} />
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <NavMain
            label="Administração"
            items={admin}
            onNavigate={closeCompactSidebar}
          />
        ) : (
          <>
            <NavMain
              label={null}
              items={primaryNavigation}
              onNavigate={closeCompactSidebar}
            />
            <NavMain
              label="Maturidade"
              items={dimensionNavigation}
              onNavigate={closeCompactSidebar}
            />
            <NavMain
              label="Ativos de gestão"
              items={managementAssetNavigation}
              onNavigate={closeCompactSidebar}
            />
            <NavMain
              label="Documentos"
              items={documentNavigation}
              onNavigate={closeCompactSidebar}
            />
          </>
        )}
      </SidebarContent>
      {!isAdmin && settingsNavigation.length > 0 ? (
        <SidebarFooter className="p-0">
          <NavMain
            label={null}
            items={settingsNavigation}
            onNavigate={closeCompactSidebar}
          />
        </SidebarFooter>
      ) : null}
      <SidebarRail />
    </Sidebar>
  );
}
