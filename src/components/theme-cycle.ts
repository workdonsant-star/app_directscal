export type ThemeChoice = "system" | "light" | "dark";

export function nextTheme(theme: string | undefined): ThemeChoice {
  if (theme === "system") return "light";
  if (theme === "light") return "dark";
  return "system";
}
