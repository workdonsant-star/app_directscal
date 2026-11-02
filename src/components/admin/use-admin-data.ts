"use client";

import { useEffect, useState } from "react";
import { useAppRuntime } from "@/components/app-runtime";

import {
  adminUpdatedEventName,
  type AdminDataSnapshot,
} from "@/lib/data/admin-snapshot";

export function useAdminDataSnapshot(initialSnapshot: AdminDataSnapshot) {
  const runtime = useAppRuntime();
  const [state, setState] = useState({ source: initialSnapshot, snapshot: initialSnapshot });
  if (state.source !== initialSnapshot) {
    setState({ source: initialSnapshot, snapshot: initialSnapshot });
  }

  useEffect(() => {
    let active = true;
    let latestRequest = 0;

    async function loadSnapshot() {
      const request = ++latestRequest;
      try {
        const response = await runtime.request("/api/admin/acquisition", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as AdminDataSnapshot;

        if (active && request === latestRequest) {
          setState({ source: initialSnapshot, snapshot: data });
        }
      } catch {
        // Conserva o último snapshot confirmado se a atualização falhar.
      }
    }

    window.addEventListener(adminUpdatedEventName, loadSnapshot);

    return () => {
      active = false;
      window.removeEventListener(adminUpdatedEventName, loadSnapshot);
    };
  }, [initialSnapshot, runtime]);

  return state.snapshot;
}
