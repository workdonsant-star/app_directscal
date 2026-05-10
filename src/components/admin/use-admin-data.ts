"use client";

import { useSyncExternalStore } from "react";

import {
  getAdminDataServerSnapshot,
  getAdminDataSnapshot,
  subscribeAdminData,
} from "@/lib/data/admin-data-source";

export function useAdminData() {
  return useSyncExternalStore(
    subscribeAdminData,
    getAdminDataSnapshot,
    getAdminDataServerSnapshot,
  );
}
