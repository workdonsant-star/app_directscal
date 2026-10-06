import * as React from "react"

const MOBILE_BREAKPOINT = 768
const SIDEBAR_COMPACT_BREAKPOINT = 1280

function createBreakpointStore(breakpoint: number) {
  const query = `(max-width: ${breakpoint - 1}px)`

  return {
    subscribe(callback: () => void) {
      const mql = window.matchMedia(query)

      mql.addEventListener("change", callback)
      return () => mql.removeEventListener("change", callback)
    },
    getSnapshot() {
      return window.matchMedia(query).matches
    },
  }
}

function getServerSnapshot() {
  return false
}

const mobileStore = createBreakpointStore(MOBILE_BREAKPOINT)
const sidebarCompactStore = createBreakpointStore(SIDEBAR_COMPACT_BREAKPOINT)

export function useIsMobile() {
  return React.useSyncExternalStore(
    mobileStore.subscribe,
    mobileStore.getSnapshot,
    getServerSnapshot
  )
}

export function useIsSidebarCompact() {
  return React.useSyncExternalStore(
    sidebarCompactStore.subscribe,
    sidebarCompactStore.getSnapshot,
    getServerSnapshot
  )
}
