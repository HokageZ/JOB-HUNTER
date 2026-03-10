# 14 - Design System: Hand-Drawn Sketch Aesthetic

> The visual identity for the entire application. Every component, page, and interaction must follow this system. No exceptions.

---

## Design Philosophy

The Hand-Drawn design style celebrates authentic imperfection and human touch in a digital world. It rejects the clinical precision of modern UI design in favor of organic, playful irregularity that evokes sketches on paper, sticky notes on a wall, and napkin diagrams from a brainstorming session.

**Core Principles:**
- **No Straight Lines**: Every border, shape, and container uses irregular border-radius values to create wobbly, hand-drawn edges that reject geometric perfection
- **Authentic Texture**: The design layers paper grain, dot patterns, and subtle background textures to simulate physical media (notebook paper, post-its, sketch pads)
- **Playful Rotation**: Elements are deliberately tilted using small rotation transforms (-2deg to 2deg) to break rigid grid alignment and create casual energy
- **Hard Offset Shadows**: Reject soft blur shadows entirely. Use solid, offset box-shadows (4px 4px 0px) to create a cut-paper, layered collage aesthetic
- **Handwritten Typography**: Use exclusively handwritten or marker-style fonts (Kalam, Patrick Hand) that feel human and approachable, never corporate or sterile
- **Scribbled Decoration**: Add visual flourishes like dashed lines, hand-drawn arrows, tape effects, thumbtacks, and irregular shapes to reinforce the sketched aesthetic
- **Limited Color Palette**: Stick to pencil blacks, paper whites, correction marker red, and post-it yellow for bold but cohesive simplicity
- **Intentional Messiness**: Embrace overlap, asymmetry, and visual "mistakes" that make the design feel spontaneous and creative rather than manufactured

**Emotional Intent:**
This style should feel approachable, creative, human-centered, and fun. It lowers barriers and invites interaction by appearing unfinished and work-in-progress, making users feel like collaborators rather than consumers.

---

## Design Token System

### Colors (Single Palette - Light Mode Only)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#fdfbf7` | Warm paper — body, page backgrounds |
| Foreground | `#2d2d2d` | Soft pencil black — text, borders (never pure black) |
| Muted | `#e5e0d8` | Old paper / erased pencil — secondary backgrounds, disabled states |
| Accent | `#ff4d4d` | Red correction marker — primary actions, important badges |
| Border | `#2d2d2d` | Pencil lead — all borders |
| Secondary Accent | `#2d5da1` | Blue ballpoint pen — links, focus states, secondary actions |
| Post-it Yellow | `#fff9c4` | Sticky note — highlight cards, feature callouts |

> **No dark mode.** This design is single-palette light mode only. The warm paper background IS the theme.

### Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Headings | `Kalam` | 700 | Thick felt-tip marker look. Import from Google Fonts. |
| Body / UI | `Patrick Hand` | 400 | Legible but distinctly handwritten. Import from Google Fonts. |

- Scale: Large and readable. Headings vary dramatically in size to look like emphasized notes.
- Heading scale: `text-4xl md:text-5xl` or `text-5xl md:text-6xl`
- Body: `text-lg md:text-xl` or `text-base md:text-xl`
- Buttons: `text-lg md:text-2xl`

### Wobbly Borders (CRITICAL)

Do NOT use standard Tailwind `rounded-*` classes. Use custom border-radius with multiple values to create irregular organic shapes.

```css
/* Wobbly variants — store in tailwind config as custom utilities */
--radius-wobbly: 255px 15px 225px 15px / 15px 225px 15px 255px;
--radius-wobbly-md: 15px 225px 15px 255px / 255px 15px 225px 15px;
--radius-wobbly-sm: 185px 10px 165px 10px / 10px 165px 10px 185px;
```

Apply via inline `style={{ borderRadius: 'var(--radius-wobbly)' }}` or Tailwind arbitrary values.

- Border Width: Thick. `border-2` minimum, `border-[3px]` or `border-4` for emphasis.
- Border Style: `border-solid` default. `border-dashed` for secondary elements, dividers, sketchy overlays.

### Shadows / Effects

| Type | Value | Usage |
|------|-------|-------|
| Standard | `4px 4px 0px 0px #2d2d2d` | Cards, buttons, inputs |
| Emphasized | `8px 8px 0px 0px #2d2d2d` | Hero elements, modals |
| Hover | `2px 2px 0px 0px #2d2d2d` | Button hover (shrink = "press") |
| Subtle | `3px 3px 0px 0px rgba(45,45,45,0.1)` | Light card depth |

**Never use blur shadows.** No `shadow-md`, `shadow-lg`, etc.

Paper texture on body:
```css
background-image: radial-gradient(#e5e0d8 1px, transparent 1px);
background-size: 24px 24px;
```

---

## Component Patterns

### Buttons

```
Normal: white bg, border-[3px] #2d2d2d, shadow-[4px_4px_0px_0px_#2d2d2d], wobbly radius
Hover:  bg fills #ff4d4d, text white, shadow shrinks to 2px 2px, translate-x-[2px] translate-y-[2px]
Active: shadow gone, translate-x-[4px] translate-y-[4px] (presses flat)
Secondary: muted bg #e5e0d8, hovers to blue #2d5da1
```

### Cards / Containers

```
Base: white bg (#ffffff), wobbly border-2 #2d2d2d, subtle shadow 3px 3px 0px rgba(45,45,45,0.1)
Decoration options:
  - "tape": translucent gray bar at top center, slight rotation
  - "tack": red circular thumbtack at top center
  - none: minimal
Special: post-it yellow #fff9c4 for highlight cards
```

### Inputs

```
Full box with wobbly borders, border-2, Patrick Hand font
Focus: border changes to blue #2d5da1, ring-2 ring-[#2d5da1]/20
Placeholder: muted color #2d2d2d/40
```

### Interactive Effects

```
Hover on cards: rotate-1 or -rotate-1 (jiggle)
Transitions: transition-transform duration-100 (fast, snappy)
Icons: lucide-react with strokeWidth={2.5} or 3, enclosed in rough circles for key icons
```

---

## Layout Rules

- Max width: `max-w-5xl` (contained like a sketchbook)
- Playful rotation: `rotate-1`, `-rotate-2` on cards, images, decorative elements
- Section padding: `py-20` for rhythm, `gap-8` in grids
- Overlap: negative margins for avatar stacks, absolute-positioned decorations outside bounds
- Stats: organic shapes with varied border-radius, not perfect circles
- Grids collapse to single column on mobile, expand on `md:`
- Hide decorative elements on mobile: `hidden md:block`
- Touch targets: minimum `h-12` (48px)

---

## What NOT To Do

- Do NOT use standard Tailwind `rounded-lg`, `rounded-xl` etc. — use wobbly custom radii
- Do NOT use blur shadows (`shadow-md`, `shadow-lg`) — only hard offset shadows
- Do NOT use system/sans-serif fonts — only Kalam and Patrick Hand
- Do NOT implement dark mode — single warm paper palette only
- Do NOT use clinical/corporate styling — everything must feel hand-drawn
- Do NOT make perfectly aligned grids — add rotation and intentional offset
- Do NOT use smooth gradients — flat colors with hard edges
