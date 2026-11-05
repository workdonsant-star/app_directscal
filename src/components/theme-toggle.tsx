"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { nextTheme } from "@/components/theme-cycle";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const selectedTheme = mounted ? theme : undefined;
  const themeChoice = selectedTheme === "light" || selectedTheme === "dark" ? selectedTheme : "system";
  const themeName = themeChoice === "system" ? "Sistema" : themeChoice === "light" ? "Claro" : "Escuro";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Tema: ${themeName}. Alternar tema`}
      title={`Tema: ${themeName}`}
      onClick={() => setTheme(nextTheme(themeChoice))}
    >
      {themeChoice === "dark" ? <Moon aria-hidden="true" className="size-4" /> : themeChoice === "light" ? <Sun aria-hidden="true" className="size-4" /> : <Monitor aria-hidden="true" className="size-4" />}
    </Button>
  );
}
