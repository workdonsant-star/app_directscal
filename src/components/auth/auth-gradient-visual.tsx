"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type DirectScalGradientInstance = {
  disconnect: () => void;
  pause: () => void;
  resize?: () => void;
};

declare global {
  interface Window {
    directScalCreateGradient?: (
      canvas: HTMLCanvasElement
    ) => DirectScalGradientInstance | null;
    directScalDestroyGradient?: (canvas: HTMLCanvasElement) => void;
    directScalGradientScriptPromise?: Promise<void>;
  }
}

function loadGradientScript() {
  if (window.directScalCreateGradient) {
    return Promise.resolve();
  }

  if (window.directScalGradientScriptPromise) {
    return window.directScalGradientScriptPromise;
  }

  window.directScalGradientScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/auth-stripe-gradient.js";
    script.defer = true;
    script.dataset.authGradientScript = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Não foi possível carregar o gradiente do login."));
    document.body.appendChild(script);
  });

  return window.directScalGradientScriptPromise;
}

export function AuthGradientVisual({
  canvasId = "gradient-canvas",
  className,
}: {
  canvasId?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || reduceMotion.matches) {
      return;
    }

    let didCancel = false;

    loadGradientScript()
      .then(() => {
        if (didCancel) return;

        window.directScalCreateGradient?.(canvas);
        window.dispatchEvent(new CustomEvent("directscal:hero-gradient-sync"));
      })
      .catch(() => {
        canvas.dataset.gradientUnavailable = "true";
      });

    return () => {
      didCancel = true;
      window.directScalDestroyGradient?.(canvas);
    };
  }, []);

  return (
    <div
      className={cn("auth-gradient-stage hero-card-stage", className)}
      data-expand-stage
    >
      <article className="auth-gradient-card hero-card" data-expand-card>
        <canvas
          ref={canvasRef}
          id={canvasId}
          className="auth-gradient-canvas hero-card__gradient"
          data-gradient-canvas
          aria-hidden="true"
        />
        <div className="auth-gradient-vignette" aria-hidden="true" />
      </article>
    </div>
  );
}
