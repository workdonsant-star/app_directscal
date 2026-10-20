"use client";

import {
  ArrowLeft,
  Plug,
  Blocks,
  Building2,
  ChartNoAxesColumn,
  ClipboardCheck,
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
  acquisitionEnabled = false,
  enabledModuleIds,
  user = data.user,
}: {
  initiativeScope?: string;
  assetNavigationPreferences?: AssetNavigationPreferences;
  managementAssetCategories?: ManagementAssetCategoryFolder[];
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
  const pathname = usePathname();
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
      className="bg-shell [&_[data-slot=sidebar-inner]]:bg-shell [&_[data-slot=sidebar-container]]:border-r-0"
    >
      <SidebarHeader className="h-18 px-2 pt-2 pb-4">
        <NavUser user={sidebarUser} />
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <NavMain
            label="Administração"
            items={admin}
            onNavigate={closeCompactSidebar}
          />
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
              canManage={user.role === "cliente"}
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
