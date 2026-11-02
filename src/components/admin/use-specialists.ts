"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminSpecialist } from "@/lib/contracts/admin-operations";
import { useAppRuntime } from "@/components/app-runtime";

type Specialist = AdminSpecialist & { archived: boolean };
const SpecialistsContext = createContext<Specialist[] | null>(null);

export function SpecialistsProvider({ initialSpecialists, children }: {
  initialSpecialists: Specialist[];
  children?: ReactNode;
}) {
  const runtime = useAppRuntime();
  const [state, setState] = useState({ source: initialSpecialists, specialists: initialSpecialists });
  if (state.source !== initialSpecialists) {
    setState({ source: initialSpecialists, specialists: initialSpecialists });
  }

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    async function load() {
      if (document.visibilityState !== "visible") return;
      const request = ++latestRequest;
      try {
        const response = await runtime.request("/api/admin/specialists", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (active && request === latestRequest) {
          setState({ source: initialSpecialists, specialists: data.specialists });
        }
      } catch {
        // A atualização em segundo plano preserva o último diretório confirmado.
      }
    }
    window.addEventListener("focus", load);
    const timer = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
      window.clearInterval(timer);
    };
  }, [initialSpecialists, runtime]);

  return createElement(SpecialistsContext.Provider, { value: state.specialists }, children);
}

export function useSpecialists() {
  const specialists = useContext(SpecialistsContext);
  if (!specialists) throw new Error("useSpecialists exige um diretório carregado no servidor.");
  return {
    specialists,
    getSpecialist: (id: string | null) => specialists.find((item) => item.id === id) ?? null,
  };
}
