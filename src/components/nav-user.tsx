"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import {
  getProfileOverridesServerSnapshot,
  getProfileOverridesSnapshot,
  subscribeProfileOverrides,
} from "@/lib/profile-storage";
import { ChevronsUpDownIcon, LogOutIcon, Moon, Sun } from "lucide-react";

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
    name: string;
    email: string;
    avatar?: string;
    initials: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const storedOverrides = useSyncExternalStore(
    subscribeProfileOverrides,
    getProfileOverridesSnapshot,
    getProfileOverridesServerSnapshot,
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const displayName = storedOverrides?.name ?? user.name;
  const displayAvatar = storedOverrides?.avatarUrl ?? user.avatar;
  const displayInitials = getInitials(displayName) || user.initials;

  function handleThemeToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="rounded-lg">
                {displayInitials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
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
            <DropdownMenuItem
              render={<Link href="/perfil" />}
              className="cursor-pointer p-0 focus:bg-accent focus:text-accent-foreground"
            >
              <div className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
            <DropdownMenuItem>
              <LogOutIcon className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
