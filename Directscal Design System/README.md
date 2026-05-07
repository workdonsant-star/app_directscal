# Directscal Design System

> **Empresa de Serviços e Tecnologia**, focada em estruturação de negócios digitais que precisam crescer.

Directscal is a technical, specialist consultancy that helps digital businesses scale. The brand sits in a deliberate tension: **traditional methodology, modern execution** — McKinsey-grade rigor delivered with the craft and density of Vercel/shadcn product UI. Premium and disruptive, not corporate-stuffy.

This design system codifies that tension into reusable type, color, motion, and component primitives.

---

## 📍 Sources

The system was built from the following inputs:

| Source | Path | Notes |
|---|---|---|
| Wordmark | `uploads/directscal-logo.svg` (copied to `assets/directscal-logo.svg`) | Yields the brand chevron mark and the primary `#185EFF` blue. |
| Favicon | `uploads/favicon.svg.svg` (copied to `assets/directscal-favicon.svg`) | Empty SVG (image reference only) — not usable as-is. **See "Caveats" below.** |
| Reference screenshot | `uploads/Captura de Tela 2026-05-06 às 08.17.47.png` | ⚠️ File could not be read — special characters in the filename block access. **See "Caveats".** |
| Inspiration brands | (described, not files) | McKinsey (charts/colors), Vercel + shadcn (interface & UX). |

---

## 🧭 Brand Positioning

| Axis | Where Directscal sits |
|---|---|
| Traditional ⇆ Modern | **70% Modern**, methodology rooted in tradition |
| Cheap ⇆ Premium | **Premium** — confident, technical, expensive |
| Generalist ⇆ Specialist | **Specialist** — speaks like an expert, not a marketer |
| Playful ⇆ Serious | **Serious-with-craft** — restrained, but never sterile |
| Decorated ⇆ Minimal | **Minimal** — typography and structure do the work |

The brand should **never** look like: corporate consulting boilerplate, SaaS-pastel decks, gradient/blob startup landing pages, or AI-generated dashboards.

---

## 🗂 Index

```
.
├── README.md                  ← you are here
├── SKILL.md                   ← Claude Code-compatible skill manifest
├── colors_and_type.css        ← design tokens (CSS custom properties)
├── assets/
│   ├── directscal-logo.svg    ← wordmark + chevrons
│   └── directscal-favicon.svg ← (empty — needs replacement)
├── preview/                   ← Design System tab cards
│   ├── colors-*.html
│   ├── type-*.html
│   ├── spacing-*.html
│   ├── components-*.html
│   └── brand-*.html
└── ui_kits/
    └── marketing-site/        ← homepage hero + sections (interactive)
        ├── README.md
        ├── index.html
        └── *.jsx
```

---

## ✍️ CONTENT FUNDAMENTALS

The voice is **expert, direct, structured**. We talk like a senior consultant who happens to ship product — not like a marketer.

### Voice principles
- **Direct, never breathless.** State the work, the method, the result. No hype words.
- **Plural "we" / impersonal you.** "We structure," "we audit." When addressing the client: "your business," "your operation" — not first-name "you" sales energy.
- **Method-led.** Sentences often begin with the *what* of the engagement: *"Estruturação de canais."*, *"Diagnóstico de pricing."*, *"Modelo de aquisição refeito do zero."*
- **Numbers and units do the bragging,** not adjectives. "+38% de margem em 90 dias" beats "incredible results."
- **Portuguese (PT-BR)** is the primary surface language; English is acceptable for technical artifacts. Do not mix mid-sentence.

### Casing & punctuation
- **Sentence case** for all UI: buttons, headings, nav. Title Case is reserved for proper nouns and product names ("Directscal", "Diagnóstico Inicial").
- **No exclamation marks** in product or marketing copy. Ever.
- **No em-dashes used decoratively** — only when grammatically necessary.
- Periods optional in single-line UI labels, mandatory in body copy.

### Vocabulary signals
- **Use:** estruturação, operação, diagnóstico, alavancagem, eficiência, margem, fluxo, modelo, escala, governança, *playbook*, *framework*, *benchmark*.
- **Avoid:** "revolucionar", "disruptar" (as a verb), "incrível", "sonho", "jornada" (overused), "transformação digital" (boilerplate), "soluções 360°", "DNA da empresa".
- **Bilingual technical terms are fine** when they're the actual term: *cohort*, *funnel*, *runway*, *unit economics*, *churn*. Do not translate them awkwardly.

### Examples

| ❌ Don't | ✅ Do |
|---|---|
| "Transformamos o DNA da sua empresa com soluções incríveis!" | "Estruturamos a operação para crescer com margem." |
| "Vamos juntos nessa jornada de sucesso 🚀" | "Diagnóstico em 14 dias. Plano em 30. Execução acompanhada." |
| "Especialistas em transformação digital" | "Especialistas em pricing, aquisição e operação para negócios digitais." |
| "Resultados incríveis para nossos clientes!" | "+38% de margem operacional em 90 dias. Estudo de caso →" |

### Emoji & ornamentation
- **Emoji: no.** Not in product, not in marketing, not in decks. The single exception is internal documentation (this README uses them for navigation/skim-ability, but customer-facing surfaces never do).
- **Decorative icons: minimal.** Charts, arrows for nav, and the brand chevron mark itself. No icon-per-bullet, no lottie animations.

---

## 🎨 VISUAL FOUNDATIONS

### Colors
- **Brand blue `#185EFF`** is signal-grade — used for one CTA per screen, link text, focused state, primary chart series. It should never tile a background.
- **Neutrals do 90% of the work.** Cool, slightly desaturated grays from `#FAFAFA` to `#08080A`. The visual weight comes from typography and structure, not color.
- **Charts** follow McKinsey's lead: a structured 6-stop palette anchored by brand blue + deep navy + neutrals, with explicit `chart-positive` (green) and `chart-negative` (red) reserved exclusively for variance/delta.
- **No gradients on backgrounds.** A subtle radial fade behind a hero is acceptable; "blue-to-purple" gradients are forbidden.

### Type
- **Sans:** Inter (display + UI) — geometric, neutral, premium when given room.
- **Serif:** Instrument Serif (italic) — used sparingly for emphasis, pull quotes, or section dividers. Never for body.
- **Mono:** JetBrains Mono — only for code, numbers in tables, and metric KPIs where tabular alignment matters.
- **Hero display** is large (88px+), tight tracking (-0.035em), semibold. Body is 15px, 1.6 line-height, `--fg-muted`.

### Backgrounds & imagery
- **No full-bleed photography by default.** When photography is used, it's **black-and-white or duotone** (brand blue + neutral), grain optional, never glossy stock.
- **No hand-drawn illustrations.** Diagrams and charts are the brand's "illustrations" — abstract data made literal.
- **Background textures:** allowed at 2-4% opacity — a fine 1px grid or noise. Never visible enough to read as decoration.

### Animation
- Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)` (standard) and `cubic-bezier(0.16, 1, 0.3, 1)` (out, for surfacing).
- Durations: **120ms / 180ms / 280ms**. Anything longer feels sluggish for this brand.
- **Fades and small translates only.** No bounce, no spring overshoot, no scale-in flourishes.
- Charts may animate-in once on view (fade + 8-12px translate). They do not loop.

### Hover & press states
- **Hover (interactive elements):** background or border darkens by ~one neutral step. On primary buttons, brand-500 → brand-600.
- **Hover (links):** color shifts to `--accent-hover` (`#1450DB`). No underline appears on hover — it should be there or not be there, not toggle.
- **Press:** brand-700, plus a 1px y-translate or scale 0.99. Pressed states are short-lived (120ms).
- **Disabled:** opacity 0.5, no pointer events. No grayscale filter.

### Borders
- **Default:** 1px solid `--border` (`#E2E2E5`).
- **Strong:** 1px solid `--border-strong` for emphasized cards or table dividers.
- **Focus:** 2px ring of `--brand-500` with a 2px white inset (the "Vercel ring"). Never just outline.

### Shadows
- Tight, low-spread, near-black at 4-12% alpha. Two-stop: a 1px tight shadow + a wider soft one.
- **No colored shadows.** No `box-shadow: 0 0 40px blue`.
- Cards usually have **no shadow** — they sit on a 1px border. Shadows show up on menus, popovers, and elevated surfaces only.

### Capsules vs gradients
- We **do not** use protection gradients on imagery. If text needs to sit on a photo, the photo gets a flat dark scrim (`rgba(8,8,10,0.55)`).
- Capsule pills are used for status, tags, and category chips: `border-radius: 999px`, 1px border, 4px/10px padding, 12px text.

### Layout
- **12-column grid**, 24px gutters, max content width **1280px** (marketing) / **1440px** (product).
- **Section padding:** 96px top/bottom desktop, 56px mobile. Generous whitespace is part of the "premium" signal.
- **Fixed elements:** the top nav is sticky on marketing surfaces, the sidebar is fixed on product surfaces. Modals lock body scroll. No floating chat bubbles, no "back to top" arrows.

### Transparency & blur
- **Blur is rare.** Used only on the sticky nav scrim (`backdrop-filter: blur(12px)` + `rgba(255,255,255,0.7)`).
- **Transparency** is used for skeleton loaders and overlays, not as a decorative pattern.

### Corner radii
- **6px (`--radius-md`)** is the default for buttons, inputs, small cards.
- **10px (`--radius-lg`)** for medium cards.
- **14px / 20px** for large hero cards, modals.
- **999px (pill)** for status badges and avatars.
- **0 (square)** is also valid — used for tables, code blocks, charts.

### Cards
- **1px border**, **no shadow** by default.
- Padding: 24px (default), 32px (feature), 16px (compact).
- Radius: 10px.
- Hover: border darkens by one step + background nudges to `--bg-subtle`.

### Tables & data density
- **Tabular numerals** required (`font-variant-numeric: tabular-nums`).
- Row height 44px, cells left-aligned for text and right-aligned for numbers.
- Zebra striping is **off** by default. Borders only on header and (optionally) row dividers at `--border-subtle`.

---

## 🎯 ICONOGRAPHY

Directscal does **not ship its own icon font**. There was no icon library in the provided assets.

**Approach:**
- We use **[Lucide](https://lucide.dev)** (CDN-loaded) as the working icon set. It matches the brand's "technical, restrained, modern" register: 1.5px stroke, 24px box, geometric, no fills.
- Stroke is **always 1.5px** at 24px size, scaling to 1.25px at 16px and 1.75px at 32px+.
- Icons inherit `currentColor` — use type tokens (`--fg`, `--fg-muted`, `--accent`) to color them. Never use named colors directly.
- **No icon backgrounds.** No "rounded square with a colored gradient and an icon inside." That's a slop tell.
- **No emoji** in customer-facing surfaces.
- **Unicode characters as icons:** allowed for typographic accents — `→` (arrows in inline links), `·` (separator), `—` (em-dash). Never `✓`, `★`, `❯` etc.
- **The brand chevron mark** (the two `< >` shapes flanking the wordmark in the logo) is reserved for the logo and very occasionally as a section bullet at small scale. It is not a generic decoration.

> **⚠️ Substitution flag:** Lucide is the closest CDN match to the brand register, but it is *not* Directscal's own. If you have a licensed icon family, drop the SVGs into `assets/icons/` and update the iconography references in `ui_kits/`.

CDN inclusion:
```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<script>lucide.createIcons();</script>
<i data-lucide="arrow-right"></i>
```

---

## 🚧 Caveats & open questions

1. **`uploads/Captura de Tela 2026-05-06 às 08.17.47.png` could not be read** — the filename's special characters block our file system. **Please re-upload it as `directscal-reference.png`** so we can pull additional brand cues from it.
2. **The favicon SVG is empty** (it references an embedded image that wasn't included). **Please re-export the favicon as a real SVG** so we can include it in the system.
3. **No font files were provided.** We've used Inter / Instrument Serif / JetBrains Mono from Google Fonts as best-guess matches for the brand register. If Directscal has licensed type, drop `.woff2` files into `fonts/` and swap the `@import` in `colors_and_type.css` for `@font-face` declarations.
4. **No icon library was provided.** Substituted Lucide via CDN — see ICONOGRAPHY.
5. **No screenshots of existing product/marketing surfaces** beyond the wordmark — the marketing UI kit is therefore an *interpretive* recreation built from the brand description and inspiration set (McKinsey/Vercel/shadcn), not a copy of an existing site.
