# TapIn Design System v3.0

The design language behind TapIn's group-admin product — a clear, confident
system for surfacing what happens when people tap.

Use this design system whenever you build TapIn-branded interfaces, internal
tools, marketing pages, or throwaway prototypes. It encodes the brand's
foundations (color, type, spacing, motion), its component vocabulary, and
how to write copy in TapIn's voice.

## Sources

The system was distilled from the production group-admin dashboard
prototype that lives in this project (May 2026). Canonical token values and
component CSS come from `styles.css`. Logo files live in `assets/`. The
icon system is captured directly from `shell.jsx`.

## Index

| File | What it is |
|---|---|
| `README.md` | This document — brand context, voice, visual foundations, iconography |
| `colors_and_type.css` | All design tokens as CSS custom properties + base typography classes |
| `design-system.html` | Single-page visual reference; same content as the cards, laid out as a doc |
| `preview/` | Per-token / per-component cards surfaced in the Design System tab |
| `assets/` | Logo files (PNG), photography, brand surfaces |
| `icons/` | The 23 canonical interface icons, as standalone SVGs |
| `SKILL.md` | Agent-readable summary for cross-tool use |

---

## Brand context

TapIn is a tap-and-engage platform. Physical "tap-points" (NFC tags, QR
codes, beacons) sit in real-world spaces — a restaurant table, a museum
plinth, a tradeshow booth — and when someone taps them they get a tailored
**experience** (a menu, a form, a video, a promo, a loyalty enrollment).
The group-admin product is how operators configure tap-points, design
experiences, and watch the resulting engagement data flow in.

The audience is operators — restaurant managers, marketing leads, retail
ops — not designers or developers. The product earns trust by being
calm, fast, and obviously readable. Numbers lead. Chrome recedes.

## Content fundamentals

**Voice:** Confident, factual, slightly clipped. Sentence fragments are
fine when they read like a glance at a dashboard. Lead with the number
or noun, not the greeting.

**Casing:** Sentence case for everything in-product (page titles, button
labels, table headers). The only exceptions are proper nouns and the
two stylized brand terms: **TapIn**, **TapPoints**.

**Person:** Second person for in-product copy ("Your dashboard", "Add a
tap-point"). First-person plural is reserved for empty-state explainers
and AI agent dialogue ("We noticed a drop in completions on Tuesday…").

**Emoji:** No. The product is the proof.

**Numbers + units:** Use comma separators (`1,402`). Percentages take no
space before `%`. Deltas are signed with `+` or `−` (not hyphen).

**Examples — DO**

> 3 spaces. 12 experiences. 1,402 taps this week.

> No taps in this range.
> Once a visitor taps any of your active tap-points, you'll see the
> activity show up here in real-time.

> Front-door welcome · 3,142 taps · +22.4%

**Examples — DON'T**

> "Welcome back! Your dashboard is ready to provide rich insights into your
> customer engagement journey 🚀"

> "Whoops! Looks like something went wrong on our end!"

> "Tap into the power of NFC technology" *(marketing-speak; we don't sell
> the technology, we sell the calm)*

---

## Visual foundations

### Color

A single saturated brand blue (`#007DF9`) sits at the center of the
system. Everything else is either:

- A tint of that blue (Blue 50 → 400) for backgrounds, hovers, soft fills
- The ink scale for text (Ink 900 / 800 / 700 / α-600 / α-500 / α-400)
- A small set of **semantics**: success / danger / warning / info / AI
- A **heat ramp** (red → orange → yellow → green → blue) reserved
  exclusively for heatmaps and engagement overlays. Never use the heat
  palette for chrome.

Backgrounds are subtly tinted, not paper-white. The dashboard canvas is
`--canvas: #F7FCFF` — a near-white with the smallest possible bias
toward the brand blue. Card surfaces stay pure white.

### Type

**Poppins** for every word of UI, weights 300–800. **JetBrains Mono**
for any value, ID, hex, or numeric token that needs to be quoted
literally.

Hierarchy lives in size + weight, not color. Headings are Ink 900 and
500–700 weight; body is Ink 700–800 at 400; captions and meta drop to
α-600. The dashboard rarely uses colored type outside of:
- Brand blue for `link`, `delta--up`, and AI mark
- Success green for positive deltas
- Danger red for destructive labels

### Spacing

A 4-based scale. Component internals usually fall between 14 and 26px;
page-level gutters at 40–50px; section rhythm at 56–80px.

### Radius

Soft, never sharp. Three values do nearly all the work:
- `8px` (--r-sm) for inline controls and tabs
- `14px` (--r-lg) for stat cards and modules
- `21px` (--r-xl) for dashboard cards (the signature radius)
- `999px` for pill buttons and dropdown triggers

### Elevation

Four levels:
- **Card** — barely lifts. `0 2px 1px 0 rgba(64,72,82,0.05)` + a 1px
  `--line-2` stroke.
- **Popover** — dropdowns, date pickers. Soft, generous.
- **Modal** — dialogs override the world.
- **Focus** — `0 0 0 3px rgba(0,125,249,0.18)` blue glow on any
  focused control.

### Motion

Quick, decisive, never showy.
- `t-fast: 140ms` for hover / color / border swaps
- `t-med: 220ms` for panel slides and modal entry
- `ease: cubic-bezier(.2, .8, .2, 1)` — confident decelerator

No bounces. No elastic. Animations clear before the user notices them.

### Hover & press states

- Buttons: background lifts to white on hover; border shifts to
  `--tapin-blue-400`.
- Primary button: background darkens from `--tapin-blue` to
  `--tapin-blue-dark` (#0066CC).
- Rows: hover background tints to `--tapin-blue-100`.
- Cards: stroke shifts to `--tapin-blue-400` (no fill change).

### Cards

White surface, `--line-2` 1px stroke, 21px radius, very subtle shadow.
Internal padding is 22–26px. Header lives in the same padding box as the
body — no inset bar. Selection state is signaled by stroke color only;
the fill stays white.

### Imagery

The product itself does not lean on photography or illustration. When
imagery does appear — logo uploads, experience hero images, heatmap
backgrounds — it is shown full-bleed inside its container, often with a
soft warm cast (the experience previews tend toward `#f5f1ea` as their
canvas). Never overlay text on imagery without a `--ink-900` solid
backplate; never use stock gradients as backgrounds.

### Transparency & blur

Used sparingly:
- The Create-Experience busy overlay uses `backdrop-filter: blur(6px)`
  on a 94% white panel
- Soft pills use `rgba` fills on Blue 100/400 to read as tinted, not
  filled

### Layout rules

- Single sidebar (sticky, 202px wide) + main column
- Page padding: 40px top, 50px horizontal, 80px bottom
- Toolbar pattern is universal: search left → filter chips → primary
  action far right
- Dashboards use a 2-column 1fr/1fr grid with 24px gap; stat-card rows
  use a 4-column grid

---

## Iconography

The product ships with 23 canonical icons, all defined inline as SVG in
`shell.jsx`. They are stored here in `icons/` as standalone files for
easy reuse.

- **Stroke style**: ~1.3–2px strokes on the outline icons, with
  `stroke-linecap: round` and `stroke-linejoin: round`
- **Fill style**: a subset of the larger 24×24 icons (TapHand, Users,
  Doc) are solid fills using `fill="currentColor"`
- **Native viewBox**: most are `15×15`; the larger fill icons are `24×24`
- **Color**: always `currentColor`, so a single CSS color flows through
- **Sizing**: 14px in tooltips, 15–16px in nav, 20–22px in stat-card
  badges, 24px max in feature illustrations

**No emoji.** Unicode is only used for low-noise glyphs that the team
already treats as typographic (·, ·, →, +, −, %).

When the canonical set doesn't include what you need, draw an icon in
the same 15×15 viewBox at 1.3–1.5px stroke weight, with rounded caps
and joins, and `currentColor` everywhere. Flag the new icon in the next
review so it can be added to `icons/`.

---

## Caveats

- The system is currently English-only. RTL has not been validated.
- Heat-scale gradient stops have been tuned for the heatmap product
  context; do not reuse them as a generic data-viz palette.
- Dark mode is not part of v3.0. The inverse logo treatment is the
  closest existing primitive.
