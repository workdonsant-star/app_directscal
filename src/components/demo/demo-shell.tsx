"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AppRuntimeProvider } from "@/components/app-runtime";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { getDemoState, updateDemo, resetDemo, useDemo } from "./demo-store";
import { applyDemoRequest } from "@/lib/data/demo/demo-request";
import { demoHref, demoPathname } from "@/lib/data/demo/demo-routes";
import { demoFolders, demoUser } from "@/lib/data/demo/demo-workspaces";

function DemoUtilities() {
 const [confirm, setConfirm] = useState(false);
 const router = useRouter();
 return <><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>Demo</DropdownMenuTrigger><DropdownMenuContent align="end">
  <DropdownMenuItem render={<Link href="/demo/agente" />}>Agente</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => setConfirm(true)}>Reiniciar demo</DropdownMenuItem>
 </DropdownMenuContent></DropdownMenu>
 <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent><DialogTitle>Reiniciar demo?</DialogTitle><DialogDescription>As alterações desta apresentação serão removidas deste navegador.</DialogDescription><DialogFooter><Button variant="secondary" onClick={() => setConfirm(false)}>Cancelar</Button><Button onClick={() => { resetDemo(); setConfirm(false); router.push("/demo"); router.refresh(); }}>Reiniciar demo</Button></DialogFooter></DialogContent></Dialog></>;
}
const runtime = {
 href: demoHref, pathname: demoPathname,
 async request(url: string, init?: RequestInit) {
  const current = getDemoState();
  const result = applyDemoRequest(current, url, init);
  if (result.state !== current) updateDemo(() => result.state);
  return Response.json(result.body, { status: result.status ?? 200 });
 },
 async signOut() { resetDemo(); window.location.assign("/demo"); },
 utilities: <DemoUtilities />,
};

export function DemoShell({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 const { state, persistent } = useDemo();
 const profile = state.profile;
 const user = profile ? { ...demoUser, name: profile.name, company: profile.companyDetails.socialName ?? profile.company, avatarUrl: profile.avatarUrl } : demoUser;
 return <AppRuntimeProvider value={runtime}><TooltipProvider delay={200}>
 {(pathname.startsWith("/demo/r/") || pathname === "/demo/responder") ? children : <SidebarProvider className="app-shell bg-shell"><AppSidebar user={user} initiativeScope="demo-vertex" assetNavigationPreferences={state.navigation} managementAssetCategories={demoFolders(state)} /><SidebarInset className="overflow-clip bg-shell">{!persistent && <p role="status" className="px-6 py-2 text-xs text-muted-foreground">As alterações duram somente nesta aba porque o armazenamento está indisponível.</p>}{children}</SidebarInset></SidebarProvider>}
 </TooltipProvider></AppRuntimeProvider>;
}
