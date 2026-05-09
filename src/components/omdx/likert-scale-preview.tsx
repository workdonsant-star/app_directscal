import type { LikertScalePoint } from "@/lib/types";

type LikertScalePreviewProps = {
  scale: LikertScalePoint[];
};

export function LikertScalePreview({ scale }: LikertScalePreviewProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {scale.map((item) => (
        <div
          key={item.value}
          className="flex min-h-24 flex-col justify-between rounded-lg border bg-background p-3"
        >
          <span className="text-foreground text-lg font-semibold tabular-nums">
            {item.value}
          </span>
          <span className="text-muted-foreground text-xs leading-snug">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
