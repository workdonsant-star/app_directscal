"use client";

import {
  ArrowLeft,
  Plug,
  Blocks,
  Building2,
  ChartNoAxesColumn,
  Eye,
  Flag,
  Megaphone,
  MessageSquareText,
  Settings,
  SquarePlus,
  ListChecks,
  Sprout,
  UserRoundCheck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAppRuntime } from "@/components/app-runtime";

import { getManagementAssetCategoryFolders, type ManagementAssetCategoryFolder } from "@/lib/data/management-asset-categories";
import type { AssetNavigationPreferences } from "@/lib/contracts/asset-navigation";
import { ManagementAssetNavigation } from "@/components/management-assets/management-asset-navigation";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
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
      title: "Analytics",
      subtitle: "Diagnóstico operacional",
      url: "/omdx",
      icon: Blocks,
    },
  ],
  omdxItems: [
    { title: "Pesquisas", url: "/omdx/diagnosticos", icon: SquarePlus },
    { title: "Diagnósticos", url: "/relatorios", icon: ChartNoAxesColumn },
    { title: "Action Points", url: "/action-points", icon: ListChecks },
  ],
  insights: [
    { name: "Cultura", url: "/insights/cultura", icon: Sprout },
    { name: "Visão", url: "/insights/visao", icon: Eye },
    {
      name: "Comunicação",
      url: "/insights/comunicacao",
      icon: MessageSquareText,
    },
    { name: "Processos", url: "/insights/processos", icon: Workflow },
    { name: "Liderança", url: "/insights/lideranca", icon: Flag },
    { name: "Performance", url: "/insights/performance", icon: Zap },
  ],
};

function SettingsNavigation({ onNavigate }: { onNavigate: () => void }) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("secao");
  const section = requested === "empresa" || requested === "slack"
    ? requested
    : Boolean(searchParams.get("slack")) ? "slack" : "setores";

  return (
    <NavMain
      label="Configurações"
      onNavigate={onNavigate}
      items={[
        { title: "Setores e lideranças", url: "/configuracoes", icon: Users, isActive: section === "setores" },
        { title: "Empresa", url: "/configuracoes?secao=empresa", icon: Building2, isActive: section === "empresa" },
        { title: "Slack", url: "/configuracoes?secao=slack", icon: Plug, isActive: section === "slack" },
      ]}
    />
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppSidebar({
  initiativeScope,
  assetNavigationPreferences = { order: [], icons: {} },
  managementAssetCategories = getManagementAssetCategoryFolders([]),
  demoMode = false,
  acquisitionEnabled = false,
  enabledModuleIds,
  user = data.user,
}: {
  initiativeScope?: string;
  assetNavigationPreferences?: AssetNavigationPreferences;
  managementAssetCategories?: ManagementAssetCategoryFolder[];
  demoMode?: boolean;
  acquisitionEnabled?: boolean;
  enabledModuleIds?: string[];
  user?: {
    avatar?: string;
    company: string;
    id: string;
    initials?: string;
    name: string;
    avatarUrl?: string | null;
    role?: "superadmin" | "admin" | "cliente";
  };
}) {
  const runtime = useAppRuntime();
  const pathname = runtime.pathname(usePathname());
  const { isCompact, isMobile, setOpen, setOpenMobile } = useSidebar();
  const closeCompactSidebar = () => {
    if (isMobile) setOpenMobile(false);
    if (isCompact) {
      setOpen(false);
    }
  };
  const sidebarUser = {
    ...user,
    avatar: user.avatarUrl ?? undefined,
    initials: user.initials ?? (getInitials(user.name) || "DS"),
  };
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isSettings = pathname === "/configuracoes" || pathname.startsWith("/configuracoes/");
  const isOrganizationAdmin = user.role === "admin";
  const enabledModuleSet = enabledModuleIds ? new Set(enabledModuleIds) : null;
  const enabledAppModules = data.appModules
    .filter((module) => {
      return !enabledModuleSet || enabledModuleSet.has(module.id);
    })
    .map((module) => ({
      ...module,
      isActive:
        pathname === "/omdx" ||
        pathname.startsWith("/omdx/") ||
        pathname === "/action-points" ||
        pathname.startsWith("/action-points/") ||
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
  const settingsNavigation = isOrganizationAdmin
    ? []
    : [
        {
          title: "Configurações",
          url: "/configuracoes",
          icon: Settings,
          isActive:
            pathname === "/configuracoes" ||
            pathname.startsWith("/configuracoes/"),
        },
      ];
  const adminGroups = [
    {
      label: "Empresas",
      items: [{
        title: "Empresas cadastradas",
        url: "/admin/empresas",
        icon: Building2,
        isActive: pathname === "/admin/empresas" || pathname.startsWith("/admin/empresas/"),
      }],
    },
    {
      label: "Equipe",
      items: [{
        title: "Especialistas",
        url: "/admin/especialistas",
        icon: UserRoundCheck,
        isActive: pathname === "/admin/especialistas" || pathname.startsWith("/admin/especialistas/"),
      }],
    },
    ...(demoMode || user.role === "superadmin" ? [{
      label: "Agentes",
      items: [{
        title: "Motores de IA",
        url: "/admin/motores-de-ia",
        icon: Plug,
        isActive: pathname === "/admin/motores-de-ia",
      }],
    }] : []),
    ...(acquisitionEnabled ? [{
      label: "Aquisição",
      items: [{
        title: "Campanhas",
        url: "/admin/campanhas",
        icon: Megaphone,
        isActive: pathname === "/admin/campanhas" || pathname.startsWith("/admin/campanhas/"),
      }],
    }] : []),
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="bg-shell [&_[data-slot=sidebar-inner]]:bg-shell [&_[data-slot=sidebar-container]]:border-r-0"
    >
      <SidebarHeader className="h-18 px-2 pt-2 pb-4">
        <NavUser user={sidebarUser} />
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          adminGroups.map((group) => (
            <NavMain
              key={group.label}
              label={group.label}
              items={group.items}
              onNavigate={closeCompactSidebar}
            />
          ))
        ) : isSettings ? (
          <Suspense fallback={null}>
            <SettingsNavigation onNavigate={closeCompactSidebar} />
          </Suspense>
        ) : (
          <>
            <NavMain
              label={null}
              items={primaryNavigation}
              onNavigate={closeCompactSidebar}
            />
            <ManagementAssetNavigation
              key={`${initiativeScope ?? user.id}:${JSON.stringify(assetNavigationPreferences)}`}
              initialPreferences={assetNavigationPreferences}
              canManage={false}
              folders={managementAssetCategories}
              onNavigate={closeCompactSidebar}
            />
            <NavMain
              label="Dimensões"
              items={dimensionNavigation}
              onNavigate={closeCompactSidebar}
            />
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <div className="hidden px-2 pt-2 group-data-[collapsible=icon]:flex">
          <SidebarTrigger aria-label="Expandir sidebar" className="size-8" />
        </div>
        {!isAdmin && settingsNavigation.length > 0 ? (
          <NavMain
            label={null}
            items={isSettings ? [{ title: "Voltar ao app", url: "/omdx", icon: ArrowLeft }] : settingsNavigation}
            onNavigate={closeCompactSidebar}
          />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
