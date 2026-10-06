"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

<<<<<<< Updated upstream
function Table({ className, ...props }: React.ComponentProps<"table">) {
=======
const operationalTableClasses = [
  "border-separate border-spacing-0 text-sm leading-5",
  "[&_thead_tr]:border-0 [&_thead_tr:hover]:bg-transparent",
  "[&_thead_th]:h-11 [&_thead_th]:bg-muted [&_thead_th]:px-4 [&_thead_th]:font-medium",
  "[&_thead_th:first-child]:rounded-l-[5px] [&_thead_th:last-child]:rounded-r-[5px]",
  "[&_thead]:bg-transparent [&_thead]:border-0",
  "[&_tbody_tr]:border-0 [&_tbody_tr:hover]:bg-transparent [&_tbody_tr[aria-expanded=true]]:bg-transparent",
  "[&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:last-child_th]:border-b-0",
  "[&_tbody_th]:h-[55px] [&_tbody_th]:border-b-[0.5px] [&_tbody_th]:border-border [&_tbody_th]:px-4 [&_tbody_th]:py-3",
  "[&_tbody_td]:h-[55px] [&_tbody_td]:border-b-[0.5px] [&_tbody_td]:border-border [&_tbody_td]:px-4 [&_tbody_td]:py-3",
].join(" ")

function Table({
  className,
  variant = "operational",
  ...props
}: React.ComponentProps<"table"> & { variant?: "default" | "operational" }) {
>>>>>>> Stashed changes
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
