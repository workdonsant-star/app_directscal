import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Tokens tipográficos e de família definidos em globals.css. Sem este registro,
// o tailwind-merge trata `text-ui-*` como cor e descarta o tamanho ao lado de
// `text-muted-foreground`, e trata `font-label` como peso.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "ui-label",
        "ui-title",
        "ui-section",
        "ui-page",
        "ui-kpi",
        "doc-label",
        "doc-table",
        "doc-body",
        "doc-h3",
        "doc-h2",
        "doc-title",
      ],
      font: ["ui", "ui-heading", "doc", "doc-heading", "label"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
