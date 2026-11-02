"use client";

import Link from "next/link";
import { useRef, useState, type ComponentProps } from "react";

const hoverIntentDelayMs = 120;

/**
 * Link que pré-carrega a página inteira quando há intenção de clique (hover
 * de 120 ms, foco ou toque). Sem intenção, mantém o padrão do Next: prefetch
 * só até a fronteira de `loading.tsx`. Equivalente ao prerender por hover do
 * site institucional, adaptado ao router do App Router.
 */
export function IntentPrefetchLink({
  onFocus,
  onPointerEnter,
  onPointerLeave,
  onTouchStart,
  ...props
}: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const [intent, setIntent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  return (
    <Link
      {...props}
      prefetch={intent ? true : null}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!intent && event.pointerType === "mouse") {
          clearTimer();
          timer.current = setTimeout(() => setIntent(true), hoverIntentDelayMs);
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        clearTimer();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setIntent(true);
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        setIntent(true);
      }}
    />
  );
}
