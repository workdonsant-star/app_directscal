"use client";

import { createContext, useContext, type ReactNode } from "react";

type AppRuntime = {
  href: (href: string) => string;
  pathname: (pathname: string) => string;
  request: (url: string, init?: RequestInit) => Promise<Response>;
  signOut?: () => Promise<void>;
  utilities?: ReactNode;
};

const defaultRuntime: AppRuntime = {
  href: href => href,
  pathname: pathname => pathname,
  request: (url, init) => fetch(url, init),
};
const AppRuntimeContext = createContext(defaultRuntime);

export function AppRuntimeProvider({ value, children }: { value: AppRuntime; children: ReactNode }) {
  return <AppRuntimeContext.Provider value={value}>{children}</AppRuntimeContext.Provider>;
}

export function useAppRuntime() {
  return useContext(AppRuntimeContext);
}
