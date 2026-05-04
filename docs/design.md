# Design System: accessibility.now

Brand: **accessibility.now** (A11y agency)
Last updated: May 2026

---

## Colour palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F7F7F5` | Page background (warm off-white) |
| `--orange` | `#FF4D1C` | Primary accent: CTAs, italic headings, hover glow |
| `--text` | `#1A1A1A` | Body text, headings |
| `--muted` | `#6B6B6B` | Secondary text, metadata |
| `--border` | `rgba(26,26,26,0.12)` | Dividers, card borders |
| `--card` | `#FFFFFF` | Card / panel backgrounds |
| `--glow` | `rgba(255,77,28,0.25)` | Button hover box-shadow |

The background uses a radial gradient from `#F0EBE3` (warm centre) to `#F7F7F5` (neutral edge) on full-page hero sections.

---

## Typography

### Heading font: Inter Tight
- Loaded from Google Fonts: `Inter+Tight:ital,wght@0,100..900;1,100..900`
- Used for all `h1`–`h4` elements and nav brand mark
- Weight convention: `800` for hero headlines, `700` for section headings, `600` for card titles
- Italic orange (`font-style: italic; color: #FF4D1C`) is used on the second line of every hero heading

### Body / code font: JetBrains Mono
- Loaded from Google Fonts: `JetBrains+Mono:wght@400..800`
- Applied via `font-family: 'JetBrains Mono', monospace` on `body`
- Used for body text, navigation labels, metadata, table content
- Weight `400` for body copy, `600`–`700` for emphasis

### Decorative heading: Playfair Display
- Imported but used sparingly for large italic display text only
- Prefer Inter Tight italic for consistency

---

## Spacing scale

Tailwind default scale is used with the following conventions:

| Context | Value |
|---|---|
| Section vertical padding | `py-24` (96px) on desktop, `py-16` on mobile |
| Hero section top padding | `pt-32` (128px) |
| Card internal padding | `p-8` (32px) |
| Grid gap | `gap-8` (32px) default, `gap-6` for dense grids |
| Max content width | `max-w-6xl` (1152px) centred with `mx-auto px-6` |

---

## Components

### Buttons

Two variants:

**Primary pill** (`.btn-gsap` class for GSAP targeting):
```html
<button class="bg-[#FF4D1C] text-white rounded-full px-8 py-3 font-bold">
  Get an audit →
</button>
```
- Hover: `scale(1.05)` via GSAP + `box-shadow: 0 0 24px rgba(255,77,28,0.4)`
- Active: `scale(0.97)`

**Ghost pill**:
```html
<button class="border border-[#1A1A1A]/20 rounded-full px-8 py-3">
  Learn more
</button>
```
- Hover: border colour transitions to `#FF4D1C`

### Cards

White background (`bg-white`), `rounded-2xl`, `border border-[#1A1A1A]/10`, `shadow-sm`.
Cards that are "featured" or "popular" gain an orange top border: `border-t-2 border-[#FF4D1C]`.

### Badge / pill labels

```html
<span class="bg-[#FF4D1C]/10 text-[#FF4D1C] rounded-full px-3 py-1 text-xs font-bold">
  COMPLIANCE
</span>
```

Category colours by topic:
- Compliance → orange `#FF4D1C`
- Technical → blue `#3B82F6`
- Testing → green `#22C55E`

### Section reveal animation

Every section uses the `useSectionReveal` hook:
```ts
const ref = useSectionReveal(); // returns a React ref
// Attach: <section ref={ref}>
```
The hook registers a GSAP ScrollTrigger that animates `opacity: 0 → 1` and `y: 40 → 0` with `duration: 0.7, ease: "power2.out"` when the element enters the viewport at 80% threshold.

**Rule**: `useSectionReveal` must be called at the top level of a component: never inside `.map()` or a conditional. Create a named sub-component if you need per-item animations (see `PourSection` pattern in `wcag-guide.tsx`).

---

## GSAP animation principles

- **Library**: GSAP 3 + ScrollTrigger plugin, imported from `"gsap"` and `"gsap/ScrollTrigger"`
- **Registration**: `gsap.registerPlugin(ScrollTrigger)` called once at app root
- **Reduced motion**: all animations respect `prefers-reduced-motion`: check `window.matchMedia("(prefers-reduced-motion: reduce)").matches` and skip or shorten animations accordingly
- **Button hover**: use `.btn-gsap` class as selector in `useEffect`, applying `gsap.to` with `scale: 1.05` on `mouseenter` and `scale: 1` on `mouseleave`
- **Stagger entrance**: for card grids use `gsap.from(targets, { stagger: 0.1, opacity: 0, y: 30, duration: 0.6 })` triggered on scroll
- **Cleanup**: always return a cleanup function from `useEffect` calling `ScrollTrigger.getAll().forEach(t => t.kill())` or scope kills to the specific trigger

---

## Shadcn / Radix UI components used

- `Accordion`: FAQ sections on Pricing, Resources pages
- `Dialog` / `Sheet`: mobile nav (planned)
- `Progress`: EAA Checklist per-section progress bars

All Radix primitives are styled with Tailwind utility classes; no separate CSS component files are used.

---

## Page layout template

```
<Nav />          : sticky, blur backdrop, z-50
<main>
  <HeroSection />: full-viewport-height, radial gradient bg
  <Section />    : alternating cream / white bg for visual rhythm
  …
</main>
<Footer />       : dark (#1A1A1A) bg, orange accent links
```
