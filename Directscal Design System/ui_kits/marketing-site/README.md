# Marketing site — Directscal

Interactive recreation of a Directscal marketing surface. This is **interpretive** — there was no existing marketing site provided, only the wordmark + a brand description. The kit is built from:

- the design tokens in `colors_and_type.css`
- the brand voice rules in the root `README.md`
- the inspiration set described by the user (McKinsey, Vercel, shadcn)

## Components

| Component | What it does |
|---|---|
| `Nav.jsx` | Sticky top nav with the wordmark, link group, and a primary CTA. Has a sub-nav drawer state. |
| `Hero.jsx` | Hero block: eyebrow, large display heading, lede, two CTAs, KPI strip. |
| `MethodSection.jsx` | The "Diagnóstico → Plano → Execução" three-step block. |
| `CaseGrid.jsx` | Grid of case-study cards. |
| `MetricChart.jsx` | Simple inline SVG line chart in the McKinsey-style palette. |
| `Footer.jsx` | Multi-column footer with the wordmark and a privacy line. |

## Run

Open `index.html`. Everything is loaded with React 18 + Babel CDN. Click "Solicitar diagnóstico" to see the form drawer; submit fakes a success state.

## Notes

- All copy is in **PT-BR** to match the brand's primary surface language.
- No emoji, no decorative gradients, no full-bleed photography. The page leans on type + structure.
- Numbers are mono with `tabular-nums`. KPI deltas in green/red.
