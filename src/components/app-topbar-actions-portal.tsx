"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function AppTopbarActionsPortal({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // The portal target only exists after the server-rendered topbar is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContainer(
      document.querySelector<HTMLElement>('[data-slot="app-topbar-actions"]'),
    );
  }, []);

  return container ? createPortal(children, container) : null;
}
