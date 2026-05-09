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
          className="w-auto min-w-[18ch] max-w-[min(48vw,28rem)]"
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
