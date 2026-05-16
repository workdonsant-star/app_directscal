"use client";

import { useEffect, useState } from "react";

export type ChartThemeColors = Record<string, string>;

function readChartCssVariables(fallbackColors: ChartThemeColors) {
  if (typeof window === "undefined") return fallbackColors;

  const styles = window.getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(fallbackColors).map(([name, fallback]) => [
      name,
      styles.getPropertyValue(name).trim() || fallback,
    ]),
  );
}

export function useChartThemeColors(fallbackColors: ChartThemeColors) {
  const [colors, setColors] = useState(() =>
    readChartCssVariables(fallbackColors),
  );

  useEffect(() => {
    let animationFrame = 0;

    function updateColors() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setColors(readChartCssVariables(fallbackColors));
      });
    }

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    });

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    colorScheme.addEventListener("change", updateColors);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      colorScheme.removeEventListener("change", updateColors);
    };
  }, [fallbackColors]);

  return colors;
}
