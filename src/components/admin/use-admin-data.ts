"use client";

import { useEffect, useState } from "react";

import {
  adminUpdatedEventName,
  getAdminDataServerSnapshot,
  type AdminDataSnapshot,
} from "@/lib/data/admin-data-source";

export function useAdminData() {
  return useAdminDataSnapshot();
}

export function useAdminDataSnapshot(initialSnapshot?: AdminDataSnapshot) {
  const [snapshot, setSnapshot] = useState<AdminDataSnapshot>(
    () => initialSnapshot ?? getAdminDataServerSnapshot(),
  );

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      const response = await fetch("/api/admin/acquisition", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as AdminDataSnapshot;

      if (active) setSnapshot(data);
    }

    if (!initialSnapshot) {
      loadSnapshot();
    }
    window.addEventListener(adminUpdatedEventName, loadSnapshot);

    return () => {
      active = false;
      window.removeEventListener(adminUpdatedEventName, loadSnapshot);
    };
  }, [initialSnapshot]);

  return snapshot;
}
