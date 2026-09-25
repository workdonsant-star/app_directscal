"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

function subscribeToTopbarActions() {
  return () => {};
}

function getTopbarActionsContainer() {
  return document.querySelector<HTMLElement>(
    '[data-slot="app-topbar-actions"]',
  );
}

function getServerTopbarActionsContainer() {
  return null;
}

export function AppTopbarActionsPortal({ children }: { children: ReactNode }) {
  const container = useSyncExternalStore(
    subscribeToTopbarActions,
    getTopbarActionsContainer,
    getServerTopbarActionsContainer,
  );

  return container ? createPortal(children, container) : null;
}
