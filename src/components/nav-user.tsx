"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useAppRuntime } from "@/components/app-runtime";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDownIcon, LogOutIcon, Moon, Sun, UserRound } from "lucide-react";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function NavUser({
  user,
}: {
  user: {
    avatar?: string;
    company: string;
    id: string;
    initials: string;
    name: string;
    role?: "superadmin" | "admin" | "cliente";
  };
}) {
  const router = useRouter();
  const runtime = useAppRuntime();
  useEffect(() => {
    function refresh() { if (document.visibilityState === "visible") router.refresh(); }
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [router]);
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const displayName = user.name;
  const displayAvatar = user.avatar;
  const displayInitials = getInitials(displayName) || user.initials;

  function handleThemeToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    if (runtime.signOut) {
      await runtime.signOut();
      setIsSigningOut(false);
      return;
    }

    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    await signOut({ callbackUrl: "/entrar", redirect: false }).catch(
      () => null,
    );
    router.push("/entrar");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Abrir menu de ${displayName}`}
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-full">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="rounded-full">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 grid-rows-[17.5px_16px] text-left text-sm">
              <span className="truncate font-medium leading-[17.5px]">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.company}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {user.role !== "superadmin" ? (
              <>
                <DropdownMenuItem render={<Link href={runtime.href("/perfil")} />}>
                  <UserRound aria-hidden="true" className="size-4" />
                  Meu perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <div className="flex justify-start px-1 py-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={isDark ? "Desativar dark mode" : "Ativar dark mode"}
                onClick={handleThemeToggle}
              >
                {isDark ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
              </Button>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSigningOut}
              onClick={handleSignOut}
              variant="destructive"
            >
              <LogOutIcon className="size-4" />
              {isSigningOut ? "Saindo" : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
