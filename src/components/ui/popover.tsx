"use client";

import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;

export function PopoverContent({ className, anchor, side = "right", align = "start", children, ...props }:
  ComponentProps<typeof PopoverPrimitive.Popup> & Pick<ComponentProps<typeof PopoverPrimitive.Positioner>, "anchor" | "side" | "align">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner anchor={anchor} side={side} align={align} sideOffset={8} collisionPadding={12} className="z-50 outline-none">
        <PopoverPrimitive.Popup className={cn("w-80 max-w-[calc(100vw-24px)] rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none", className)} {...props}>
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
