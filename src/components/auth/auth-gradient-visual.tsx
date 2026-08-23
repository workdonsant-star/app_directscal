"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type MeshBlob = {
  color: string;
  phaseX: number;
  phaseY: number;
  stops: [number, number, number, number];
  x: number;
  y: number;
};

const BLOOM_FIELD_SEED = 174074637;
const MOTION_AMOUNT = 1;
const MOTION_DIRECTION = 1;
const MOTION_RADIUS = 14;

function seededPhase(offset: number) {
  const value = Math.sin(BLOOM_FIELD_SEED + offset * 12.9898) * 43758.5453123;
  return (value - Math.floor(value)) * Math.PI * 2;
}

const BLOBS: MeshBlob[] = [
  {
    color: "var(--auth-gradient-white)",
    phaseX: seededPhase(1),
    phaseY: seededPhase(11),
    stops: [19.02, 38.05, 57.07, 76.1],
    x: 67.04,
    y: 45.93,
  },
  {
    color: "var(--auth-gradient-matcha)",
    phaseX: seededPhase(2),
    phaseY: seededPhase(12),
    stops: [16.75, 33.5, 50.25, 67],
    x: 35.47,
    y: 65.92,
  },
  {
    color: "var(--auth-gradient-violet)",
    phaseX: seededPhase(3),
    phaseY: seededPhase(13),
    stops: [10.28, 20.55, 30.83, 41.1],
    x: 48.33,
    y: 20.11,
  },
  {
    color: "var(--auth-gradient-lapis)",
    phaseX: seededPhase(4),
    phaseY: seededPhase(14),
    stops: [13.51, 27.03, 40.54, 54.05],
    x: 80.81,
    y: 88.03,
  },
];

function colorWithAlpha(color: string, alpha: number) {
  return `rgb(from ${color} r g b / ${alpha})`;
}

function createBlobGradient(blob: MeshBlob, spin: number) {
  const x =
    blob.x +
    (Math.sin(spin * 0.55 + blob.phaseX) - Math.sin(blob.phaseX)) *
      MOTION_RADIUS *
      MOTION_AMOUNT;
  const y =
    blob.y +
    (Math.sin(spin * 0.43 + blob.phaseY) - Math.sin(blob.phaseY)) *
      MOTION_RADIUS *
      MOTION_AMOUNT;
  const [stop1, stop2, stop3, fadeEnd] = blob.stops;

  return `radial-gradient(circle at ${x}% ${y}%, ${colorWithAlpha(blob.color, 1)} 0%, ${colorWithAlpha(blob.color, 0.844)} ${stop1}%, ${colorWithAlpha(blob.color, 0.5)} ${stop2}%, ${colorWithAlpha(blob.color, 0.156)} ${stop3}%, ${colorWithAlpha(blob.color, 0)} ${fadeEnd}%)`;
}

function renderBloomField(element: HTMLDivElement, ph: number) {
  const spin = ph * MOTION_DIRECTION;
  element.style.backgroundImage = BLOBS.map((blob) =>
    createBlobGradient(blob, spin),
  ).join(", ");
}

export function AuthGradientVisual({
  visualId = "gradient-visual",
  className,
}: {
  visualId?: string;
  className?: string;
}) {
  const meshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!mesh) {
      return;
    }

    let animationFrame = 0;
    let isVisible = false;
    let startedAt: number | null = null;

    const animate = (timestamp: number) => {
      if (startedAt === null) {
        startedAt = timestamp;
      }

      const t = (timestamp - startedAt) / 1000;
      const ph = t * 1;
      renderBloomField(mesh, ph);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const stop = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      startedAt = null;
    };

    const start = () => {
      if (!isVisible || reduceMotion.matches || animationFrame) {
        return;
      }

      renderBloomField(mesh, 0);
      animationFrame = window.requestAnimationFrame(animate);
    };

    const handleMotionPreference = () => {
      if (reduceMotion.matches) {
        stop();
        renderBloomField(mesh, 0);
        return;
      }

      start();
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible) {
        start();
      } else {
        stop();
      }
    });

    visibilityObserver.observe(mesh);
    reduceMotion.addEventListener("change", handleMotionPreference);

    return () => {
      visibilityObserver.disconnect();
      reduceMotion.removeEventListener("change", handleMotionPreference);
      stop();
    };
  }, []);

  return (
    <div className={cn("auth-gradient-stage", className)}>
      <div className="auth-gradient-card">
        <div
          ref={meshRef}
          id={visualId}
          className="auth-gradient-mesh"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
