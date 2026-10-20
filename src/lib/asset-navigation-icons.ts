import names from "@/lib/lucide-icon-names.json";

export const lucideIconNames: readonly string[] = names;
const knownIcons = new Set(lucideIconNames);
const legacyIcons: Record<string, string> = {
  people: "users", governance: "scale", culture: "heart-handshake",
  communication: "message-square-text", book: "book-open", document: "file-text",
  business: "briefcase-business", process: "workflow", growth: "sprout", performance: "zap",
};
export function resolveAssetIconName(name: string): string {
  return name.startsWith("lucide:") ? name.slice(7) : legacyIcons[name] ?? name;
}
export function isAssetIconName(name: string): boolean {
  return knownIcons.has(resolveAssetIconName(name));
}
