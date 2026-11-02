"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

export const initiativeKinds = {
  website: "Site",
  oferta: "Oferta",
  aplicativo: "Aplicativo",
  teste: "Teste",
} as const;
export const initiativeStatuses = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  pausada: "Pausada",
} as const;
const initiativeSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  kind: z.enum(["website", "oferta", "aplicativo", "teste"]),
  objective: z.string().max(1200),
  owner: z.string().max(120),
  deadline: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["planejada", "em_andamento", "concluida", "pausada"]),
});
export type Initiative = z.infer<typeof initiativeSchema>;

const eventName = "directscal:initiatives";
function key(scope: string) {
  return `directscal:initiatives:v1:${scope}`;
}

export function useInitiatives(scope: string) {
  const raw = useSyncExternalStore(
    (callback) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === key(scope) || event.key === null) callback();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(eventName, callback);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(eventName, callback);
      };
    },
    () => {
      try {
        return localStorage.getItem(key(scope));
      } catch {
        return null;
      }
    },
    () => undefined,
  );
  let parsed: { success: boolean; data?: Initiative[] } | null = null;
  try {
    parsed = raw ? z.array(initiativeSchema).safeParse(JSON.parse(raw)) : null;
  } catch {
    /* Dados locais inválidos não criam iniciativas. */
  }
  const isLoaded = raw !== undefined;
  const initiatives = !isLoaded ? [] :
    parsed?.success && parsed.data ? parsed.data : [];
  function save(next: Initiative[]) {
    if (!isLoaded) return false;
    try {
      localStorage.setItem(
        key(scope),
        JSON.stringify(z.array(initiativeSchema).parse(next)),
      );
      window.dispatchEvent(new Event(eventName));
      return true;
    } catch {
      return false;
    }
  }
  return { initiatives, save, isLoaded };
}
