"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ReportDownloadMenuProps = {
  align?: ComponentProps<typeof DropdownMenuContent>["align"];
  className?: string;
  diagnosticId: string;
  hideLabelOnMobile?: boolean;
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

function downloadReport(diagnosticId: string, format: "csv" | "pdf") {
  const suffix = format === "csv" ? "?formato=csv" : "";

  window.location.assign(`/omdx/${diagnosticId}/relatorio${suffix}`);
}

export function ReportDownloadMenu({
  align = "end",
  className,
  diagnosticId,
  hideLabelOnMobile = false,
  label = "Baixar relatório",
  size = "default",
  variant = "default",
}: ReportDownloadMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={label}
            className={className}
            size={size}
            variant={variant}
          />
        }
      >
        <Download className="size-4" />
        <span className={cn(hideLabelOnMobile && "hidden sm:inline")}>
          {label}
        </span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuItem onClick={() => downloadReport(diagnosticId, "pdf")}>
          <FileText className="size-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadReport(diagnosticId, "csv")}>
          <FileSpreadsheet className="size-4" />
          CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
