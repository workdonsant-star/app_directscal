"use client";

import { useSyncExternalStore } from "react";
import { createDemoState, DEMO_STORAGE_KEY, restoreDemoState, type DemoState } from "@/lib/data/demo/demo-state";

const initialState = createDemoState();
let snapshot = initialState;
let initialized = false;
let persistent = true;
const listeners = new Set<() => void>();

function readSnapshot() {
  if (!initialized) {
    initialized = true;
    try { snapshot = restoreDemoState(localStorage.getItem(DEMO_STORAGE_KEY)); }
    catch { persistent = false; }
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (event.key === DEMO_STORAGE_KEY || event.key === null) {
      snapshot = restoreDemoState(event.newValue);
      listeners.forEach(notify => notify());
    }
  }
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
export function updateDemo(update: (state: DemoState) => DemoState) {
  snapshot = update(readSnapshot());
  try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot)); }
  catch { persistent = false; }
  listeners.forEach(listener => listener());
}
export function resetDemo() {
  const previous = readSnapshot();
  for (const token of previous.responseTokens) {
    try {
      localStorage.removeItem(`directscal:omdx-response:${token}`);
      localStorage.removeItem(`directscal:omdx-submission:${token}`);
    } catch { persistent = false; }
  }
  snapshot = createDemoState();
  try { localStorage.removeItem(DEMO_STORAGE_KEY); }
  catch { persistent = false; }
  listeners.forEach(listener => listener());
}
export function useDemo() {
  const state = useSyncExternalStore(subscribe, readSnapshot, () => initialState);
  return { state, persistent };
}

export function getDemoState() {
  return readSnapshot();
}
