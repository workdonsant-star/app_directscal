import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Diagnostic } from "@/lib/types";
import { cn } from "@/lib/utils";

type DimensionDiagnosticFilterProps = {
  id?: string;
  compact?: boolean;
  diagnostics: Diagnostic[];
  value: string;
  onChange: (value: string) => void;
};

export function DimensionDiagnosticFilter({
  id = "dimension-diagnostic-filter",
  compact = false,
  diagnostics,
  value,
  onChange,
}: DimensionDiagnosticFilterProps) {
  const options = [
    { value: "todos", label: "Todos os diagnósticos" },
    ...diagnostics.map((diagnostic) => ({
      value: diagnostic.id,
      label: diagnostic.name,
    })),
  ];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label
        htmlFor={id}
        className={cn(
          compact
            ? "sr-only"
            : "hidden text-xs font-medium text-muted-foreground sm:block",
        )}
      >
        Diagnóstico
      </label>
      <Select
        value={value}
        items={options}
        onValueChange={(nextValue) => {
          if (typeof nextValue === "string") {
            onChange(nextValue);
          }
        }}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "w-auto min-w-[18ch]",
            compact
              ? "h-8 max-w-[min(80vw,28rem)] gap-4 rounded-[5px] border-0 bg-sidebar-accent px-3 shadow-none"
              : "max-w-[min(48vw,28rem)]",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
