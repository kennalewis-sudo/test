---
name: tapin-design
description: Use this skill to generate well-branded interfaces and assets for TapIn, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI components for prototyping TapIn's group-admin product and adjacent surfaces (marketing, docs, mobile experience previews).
user-invocable: true
---

Read `README.md` for the brand context, voice rules, visual foundations,
and iconography conventions. The full token set lives in
`colors_and_type.css` — import that into any HTML artifact you build, and
read from the CSS custom properties instead of hard-coding hex values.

Key files:
- `README.md` — brand, voice, visual foundations, iconography (read first)
- `colors_and_type.css` — every design token + base typography classes
- `design-system.html` — single-page reference doc; useful for visual
  copy-paste when you need a component pattern
- `preview/` — per-token / per-component example cards (one HTML file per
  card); look here before drawing new patterns
- `icons/` — the 23 canonical SVG icons used in the product
- `assets/` — logo PNGs, brand surfaces

If you are creating visual artifacts (slides, mocks, throwaway prototypes,
HTML pages), copy the assets you need into the artifact's project and link
`colors_and_type.css` so the tokens travel with the file.

If you are working on production code, treat the CSS variables as the
contract: use them, don't override them.

If the user invokes this skill without further guidance, ask what they want
to build, ask 4–8 design-relevant questions (audience, surface, fidelity,
desired variants, copy/voice considerations, brand vs prototype freedom),
then act as an expert TapIn designer and produce one or more HTML
artifacts.

### Critical rules

- One brand blue. Never invent new accent colors. Use the heat ramp only
  for heatmaps and engagement overlays.
- Hierarchy lives in size + weight, not color. Headings are Ink 900;
  colored text is reserved for links, deltas, and AI.
- Sentence case for in-product copy. No emoji. No hype.
- Cards are 21px radius with a 1px `--line-2` stroke and the `--sh-card`
  shadow. Selection signals through stroke only.
- Buttons round to a full pill. Primary is the brand blue with the
  blue-tinted shadow.
- Use the icons in `icons/` rather than drawing new ones. If you need an
  icon that's not in the set, draw at 15×15 with a 1.3–1.5px stroke,
  rounded caps and joins, `currentColor` everywhere, and flag the
  addition for review.
