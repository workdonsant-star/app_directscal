"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const selectedTheme = mounted ? theme : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Selecionar tema" render={<Button variant="ghost" size="icon" />}>
        {selectedTheme === "dark" ? <Moon className="size-4" /> : selectedTheme === "light" ? <Sun className="size-4" /> : <Monitor className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={selectedTheme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="system"><Monitor aria-hidden="true" />Sistema</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light"><Sun aria-hidden="true" />Claro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"><Moon aria-hidden="true" />Escuro</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
