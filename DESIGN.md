---
name: Dhanlaxmi Catering
description: Tablet-first catering ops — materials, vendors, orders, menus on iPad.
colors:
  primary: "oklch(0.48 0.11 175)"
  primary-soft: "oklch(0.96 0.03 175)"
  primary-foreground: "oklch(1 0 0)"
  accent: "oklch(0.52 0.08 245)"
  bg: "oklch(1 0 0)"
  surface: "oklch(0.975 0.008 175)"
  ink: "oklch(0.24 0.02 175)"
  muted: "oklch(0.46 0.025 175)"
  border: "oklch(0.91 0.01 175)"
  ring: "oklch(0.48 0.11 175)"
  backdrop: "oklch(0.22 0.02 175 / 0.45)"
  pdf-teal: "#0F766E"
  pdf-teal-deep: "#0D5C56"
  pdf-teal-line: "#A5D4CE"
  pdf-cream: "#F7FAFA"
  pdf-ink: "#1A2423"
  pdf-muted: "#5A6967"
  pdf-rule: "#D5E0DE"
  pdf-white: "#FFFFFF"
typography:
  brand:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
  pdf-body:
    fontFamily: "SourceSans, sans-serif"
    fontSize: "10pt"
    fontWeight: 400
  pdf-display:
    fontFamily: "Playball, cursive"
    fontSize: "22pt"
    fontWeight: 400
  pdf-serif:
    fontFamily: "Cormorant, serif"
    fontSize: "14pt"
    fontWeight: 600
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  tap: "40px"
  tap-lg: "44px"
  fab: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    height: "{spacing.tap}"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    height: "{spacing.tap}"
  button-icon:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    size: "{spacing.tap}"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  chip-primary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  chip-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  nav-tile:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
  list-surface:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  dialog:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
---

# Design System: Dhanlaxmi Catering

## 1. Overview

**Creative North Star: "Dhanlaxmi Catering"**

This is the visual system for a tablet-first catering operations tool. Screens should feel like a calm kitchen desk on an iPad: soft, touch-forward controls, pure white working surfaces, and one teal accent that marks action without decorating the room. Density stays low; every screen has one job. The teal reads clearly in presentations and on projected screens.

The system rejects marketing landing-page aesthetics (hero metrics, gradient text, cream/sand backgrounds), dense desktop-only admin panels, and hamburger-only navigation without a clear path home. Brand shows in the page header name and the teal mark — not in hero copy or campaign chrome.

**Key Characteristics:**
- Pure white canvas + cool mist surface tint; restrained teal accent
- Geist sans throughout; brand name outranks page title
- Flat at rest; light lift only on dialogs and floating actions
- Large tap targets (40–48px) for gloves / wet hands
- Navigation tiles are destinations, not content cards

## 2. Colors

Restrained palette: neutrals carry the UI; teal speaks only for action, focus, and status chips.

### Primary
- **Teal** (`oklch(0.48 0.11 175)`): Primary buttons, brand mark fill, focus ring, selected chips, hover accents on nav tiles. Keep it scarce. Chosen for presentation clarity (projects well vs warm orange).
- **Teal wash** (`oklch(0.96 0.03 175)`): Soft fills behind icons and primary chips — never full-bleed section backgrounds.
- **On primary** (`oklch(1 0 0)`): Text/icons on solid teal.

### Secondary
- **Cool slate accent** (`oklch(0.52 0.08 245)`): Rare secondary cue when teal would over-signal; do not compete with primary on the same control.

### Neutral
- **Pure white** (`oklch(1 0 0)`): Page background and list/dialog surfaces.
- **Cool mist surface** (`oklch(0.975 0.008 175)`): Hover washes, muted chip fills, subtle insets — light teal tint, never cream theater.
- **Ink** (`oklch(0.24 0.02 175)`): Body and titles. High contrast for bright kitchens.
- **Muted ink** (`oklch(0.46 0.025 175)`): Supporting copy and secondary labels only; never for primary body on tinted surfaces without checking contrast.
- **Hairline border** (`oklch(0.91 0.01 175)`): List shells, tile edges, field strokes.
- **Dialog backdrop** (`oklch(0.22 0.02 175 / 0.45)`): Dimmed overlay behind modals.

### PDF (hex — `@react-pdf` has no OKLCH)
- Teal `#0F766E`, deep `#0D5C56`, line `#A5D4CE`, cream `#F7FAFA`, ink `#1A2423`, muted `#5A6967`, rule `#D5E0DE`, white `#FFFFFF`.

### Named Rules
**The One Teal Rule.** Teal occupies ≤10% of any screen. If a layout feels “branded green,” pull color back into buttons, chips, and the header mark only.

**The Kitchen Contrast Rule.** Ink on white is the default reading pair. Do not lighten muted text further for “elegance.”

## 3. Typography

**Display Font:** Geist (with system-ui sans fallback)  
**Body Font:** Geist (same family)  
**Label/Mono Font:** Geist Mono (for codes / technical snippets only)  
**Menu PDF only:** SourceSans (body), Playball (script display), Cormorant (serif titles) — printed menus only, not app UI.

**Character:** A single modern geometric sans — clear at arm’s length on an iPad, never decorative. Hierarchy comes from weight and size, not a second display face.

### Hierarchy
- **Brand** (600, 1.25rem / `text-xl`, tracking -0.02em): “Dhan Laxmi Catering Service” in the page header — the strongest name on screen.
- **Headline** (600, 1.5rem / `text-2xl`, tracking -0.02em): Section questions and page-level prompts (“Where do you want to go?”). Use `text-wrap: balance`.
- **Title** (600, 1rem / `text-base`): Nav tile titles, row titles, dialog headings.
- **Body** (400, 0.875rem / `text-sm`): Descriptions, form help, list secondary lines. Cap line length with `max-w-prose`; use `text-wrap: pretty` on longer prose.
- **Label** (500, 0.75rem / `text-xs`): Chips, tags, meta.
- **Page crumb** (400, 0.875rem, muted): The `<h1>` under the brand is intentionally quieter than the brand line.

### Named Rules
**The Brand-First Header Rule.** The catering service name stays larger/stronger than the current page title. Never invert that hierarchy.

## 4. Elevation

Hybrid: surfaces stay flat at rest. Depth comes from hairline borders and the cool mist surface tint. Light lift appears only when something floats over the canvas — native dialogs with a dimmed backdrop, and the fixed back / add FABs with soft blur.

### Shadow Vocabulary
- **None at rest** (`box-shadow: none`): Lists, tiles, cards, toolbars.
- **Dialog backdrop** (`oklch(0.22 0.02 175 / 0.45)`): Modal focus; the dialog itself is a bordered white panel, not a floating card with drop shadow.
- **FAB veil** (`backdrop-filter: blur` + translucent fill): Floating back and add controls only.

### Named Rules
**The Flat-By-Default Rule.** No decorative drop shadows on content. If it looks like a SaaS dashboard card stack, remove the shadow and keep the border.

## 5. Components

Soft and touch-forward: generous min-heights, rounded-lg/xl corners, clear focus rings using teal.

### Buttons
- **Shape:** Gently rounded (`8px` / `rounded-lg`); FABs are full circles (`48px`).
- **Primary:** Teal fill + white label; `min-h-10` or `min-h-11`; horizontal padding `16px`. Hover: opacity ~90%. Focus: `ring-2` with `{colors.ring}`.
- **Secondary / Ghost:** White or transparent fill, hairline border, ink label; hover washes to surface.
- **Icon actions:** Square `min-h-10 min-w-10` targets; never shrink below tap size for chrome density.

### Chips
- **Primary chip:** Teal wash background + teal text (`rounded-md`, tight padding).
- **Muted chip:** Surface background + muted text for counts and neutral tags.
- **State:** Selected filters use primary border/fill; unselected stay bordered white.

### Cards / Containers
- **Corner Style:** `12px` (`rounded-xl`) for list shells and grid tiles.
- **Background:** Pure white; hover may use surface.
- **Shadow Strategy:** None — border only.
- **Border:** Hairline `{colors.border}`.
- **Internal Padding:** `16px` (`p-4`) on grid tiles; list rows use divide-y inside one bordered shell.

### Inputs / Fields
- **Style:** White fill, hairline border, `8px` radius, `py-2.5 px-3`, `text-sm`.
- **Focus:** Border shifts to primary; soft `ring-2` at `ring/30`.
- **Placeholder:** Muted ink — keep contrast honest; do not go lighter than `{colors.muted}`.

### Navigation
- **Home tiles (signature):** Full-width destinations with icon well (soft teal → solid teal on hover), title + description, chevron. `min-h` comfortable; `rounded-xl` border. These are places to go, not content cards.
- **Back FAB:** Fixed bottom-left circle (`48px`), translucent white + blur, always a path home from nested routes.
- **Add FAB:** Fixed primary circle when the section supports create.

### Dialog
- Native `<dialog class="app-dialog">`: white panel, `12px` radius, hairline border, dimmed ink backdrop. Wide variant caps ~42rem for denser forms. Footer actions sit on a top-bordered bar.

## 6. Do's and Don'ts

### Do:
- **Do** design for iPad Safari / home-screen first: large tap targets (`≥40px`, prefer `44–48px` for primary actions).
- **Do** keep brand name visually above page title in the header.
- **Do** use teal for actions, focus, and scarce status — not for backgrounds.
- **Do** prefer bordered list shells and nav tiles over elevated cards.
- **Do** honor `prefers-reduced-motion` (global transitions collapse).
- **Do** keep ink-on-white as the default reading pair for kitchen / outdoor readability.

### Don't:
- **Don't** use marketing landing page aesthetics (hero metrics, gradient text, cream/sand backgrounds).
- **Don't** build dense desktop-only admin panels as the primary layout.
- **Don't** ship hamburger-only navigation on mobile without a clear home path back.
- **Don't** add side-stripe (`border-left` accent) decorations or gradient text.
- **Don't** stack nested cards or decorative multi-layer shadows.
- **Don't** shrink controls below glove-friendly tap size to “fit more on desktop.”
