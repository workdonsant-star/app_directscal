import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Diagnostic } from "@/lib/types";

type DimensionDiagnosticFilterProps = {
  diagnostics: Diagnostic[];
  value: string;
  onChange: (value: string) => void;
};

export function DimensionDiagnosticFilter({
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
        htmlFor="dimension-diagnostic-filter"
        className="hidden text-xs font-medium text-muted-foreground sm:block"
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
          id="dimension-diagnostic-filter"
          className="h-7 w-auto min-w-[18ch] max-w-[min(48vw,28rem)] gap-1 rounded-[min(var(--radius-md),12px)] border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 [&_[data-slot=select-icon]>svg]:size-3.5"
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
