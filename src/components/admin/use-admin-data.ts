"use client";

import { useEffect, useState } from "react";

import {
  adminUpdatedEventName,
  getAdminDataServerSnapshot,
  type AdminDataSnapshot,
} from "@/lib/data/admin-data-source";

export function useAdminData() {
  const [snapshot, setSnapshot] = useState<AdminDataSnapshot>(
    getAdminDataServerSnapshot,
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

    loadSnapshot();
    window.addEventListener(adminUpdatedEventName, loadSnapshot);

    return () => {
      active = false;
      window.removeEventListener(adminUpdatedEventName, loadSnapshot);
    };
  }, []);

  return snapshot;
}
