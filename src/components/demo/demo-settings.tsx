"use client";
import { useDemo } from "./demo-store";
import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";
import { CompanySettings } from "@/components/settings/company-settings";
import { OrganizationStructureSettings } from "@/components/settings/organization-structure-settings";
import { SlackIntegrationSettings } from "@/components/settings/slack-integration-settings";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { demoProfile, demoSectors } from "@/lib/data/demo/demo-workspaces";
import { DEMO_DATE } from "@/lib/data/demo/demo-data";
export function DemoSettings({ section, personal = false }: { section?: string; personal?: boolean }) {
 const { state } = useDemo();
 const profile = state.profile ?? demoProfile;
 return <><AppTopbar /><AppPage className="min-w-0 overflow-x-clip"><div className="flex min-w-0 w-full flex-col gap-6">{personal ? <><h1 className="text-ui-page">Perfil</h1><ProfileSettings profile={profile} passwordEnabled={false} /></> : section === "empresa" ? <><h1 className="text-ui-page">Empresa</h1><CompanySettings profile={profile} /></> : section === "slack" ? <><h1 className="text-ui-page">Slack</h1><SlackIntegrationSettings available={false} connection={state.slackConnected ? { teamName: "Vertex Logistics", installedAt: DEMO_DATE } : null} needsReconnect={false} result={null} /></> : <OrganizationStructureSettings sectors={state.sectors ?? demoSectors} />}</div></AppPage></>;
}
