"use client";
import { useEffect, useState } from "react";
import type { AdminSpecialist } from "@/lib/contracts/admin-operations";
type Specialist = AdminSpecialist & { archived: boolean };
export function useSpecialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/admin/specialists", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const data = await response.json();
      if (active) setSpecialists(data.specialists);
    }
    void load();
    window.addEventListener("focus", load);
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.removeEventListener("focus", load); window.clearInterval(timer); };
  }, []);
  return {
    specialists,
    getSpecialist: (id: string | null) => specialists.find((item) => item.id === id) ?? null,
  };
}
