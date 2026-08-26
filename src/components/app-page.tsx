import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type AppPageProps = ComponentProps<"main">;

export function AppPage({ className, ...props }: AppPageProps) {
  return (
    <main
      className={cn("flex flex-1 flex-col px-6 py-8 lg:px-10", className)}
      {...props}
    />
  );
}
