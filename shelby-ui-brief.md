# Shelby RAG — Studio-Grade UI Brief
> For Codex in VSCode. Add this file to your workspace.
> Reference it by saying: "Follow the UI brief in shelby-ui-brief.md for all design decisions."
> You (the user) run terminal commands. Codex writes the code.

---

## Your Job as Codex

For every UI task:
1. Write the code following this brief exactly
2. Use only the tokens, fonts, and animation patterns defined here
3. Name your animation pattern in a comment above it
4. After finishing each page/component, describe what it looks like in plain English
5. Wait for approval before moving to the next page

Do not use inline hex colors. Do not install animation libraries beyond what's listed.
Do not write glassmorphism, purple gradients, or bouncy spring animations.

---

## Terminal Commands (User Runs These)

Before any UI work, make sure these are installed:

```bash
npm install framer-motion gsap @studio-freight/lenis
npm install lucide-react
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input dialog badge tabs tooltip
```

For Google Fonts, add this to `app/layout.tsx` inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
```

---

## Step 1 — Write This First: `app/globals.css` Tokens

Before any component exists, write these CSS variables into `app/globals.css`.
Every component references these. No hardcoded colors ever.

```css
:root {
  /* Backgrounds */
  --bg-base:     #0e1011;   /* page background — NOT pure black */
  --bg-surface:  #141618;   /* cards, panels */
  --bg-elevated: #1c1f21;   /* modals, hover states */
  --bg-subtle:   #232729;   /* dividers, inactive states */

  /* Text */
  --text-primary:   #e3e2e2; /* NOT pure white */
  --text-secondary: #8b9094;
  --text-tertiary:  #4d5458;

  /* Accent — Shelby teal */
  --accent:      #3ecfcf;
  --accent-dim:  #1a7a7a;
  --accent-glow: rgba(62, 207, 207, 0.12);

  /* Semantic */
  --success: #3ecf8e;
  --warning: #f5a623;
  --danger:  #e5534b;

  /* Borders */
  --border:        rgba(255, 255, 255, 0.06);
  --border-hover:  rgba(255, 255, 255, 0.12);
  --border-accent: rgba(62, 207, 207, 0.3);

  /* Fonts */
  --font-display: 'Syne', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
```

---

## Visual Direction

**Aesthetic:** Dark technical. Premium developer infrastructure tool.
Think Vercel, Linear, Supabase — not a crypto app, not a startup template.

**The signature moment:** Every time a receipt is verified, a teal pulse
radiates from the verified badge. The whole app is built around that one moment.

**Rules:**
- Dark surfaces with precise low-opacity borders (never heavy shadows)
- Teal accent used sparingly — only CTAs, active states, verified states
- Monospace font for all technical data: blob names, hashes, timestamps, merkle roots
- Generous whitespace. Do not crowd components.
- No pure `#000000`. No pure `#ffffff`. Use the token variables.
- No glassmorphism. No purple gradients. No bouncy animations.

**Reference sites to study before designing any section:**
- vercel.com — surface hierarchy, type scale, button precision
- linear.app — editorial density, section transitions
- supabase.com — developer tool aesthetic, teal accent usage
- stripe.com — typography, splittext reveals

Do not copy them. Understand why they work, apply those principles to Shelby's context.

---

## Page Structure

### `/` Home
Two-panel layout (desktop): left = document uploader, right = query interface.
Single column on mobile.
Background: `--bg-base` with subtle radial gradient using `--accent-glow` at center.
Query panel gets `--border-accent` when user is actively typing.

### `/documents`
Dense list view. Table-style rows.
Each row: filename, chunk count, upload date, account address (truncated), status badge.
Empty state: centered SVG illustration + headline + upload CTA.

### `/receipts`
Card grid. Each card: question preview (truncated), answer snippet, timestamp, source count.
Default cards: `--border` stroke.
Verified receipts: `--border-accent` stroke + small teal dot.

### `/receipts/[id]`
Full-width single column, three visual zones:
1. **Answer block** — large question + answer text, model badge
2. **Sources block** — expandable source chunk cards
3. **Verification block** — hash comparison, status indicators, re-verify button

---

## Animation Patterns

Use these by name. Write the pattern name in a comment above every animation.

### `fade-up-reveal`
Standard entrance for cards and content entering viewport.
```tsx
// fade-up-reveal
<motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
>
```

### `stagger-children`
For lists and grids. Parent orchestrates children.
```tsx
// stagger-children
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } }
}
```

### `verification-pulse`
The signature animation. Plays once when a receipt is verified.
Teal ring expands outward from the verified badge and fades.
```tsx
// verification-pulse
<motion.div
  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0] }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
  style={{
    position: 'absolute', inset: -8,
    border: '1px solid var(--accent)',
    borderRadius: '50%',
    pointerEvents: 'none'
  }}
/>
```

### `hash-typewrite`
For merkle roots and hashes — characters appear left to right on load.
Use `motion.span` with character-by-character stagger at 0.02s delay.
Font: `var(--font-mono)`.

### `blob-upload-progress`
During document ingestion. A 2px line that fills left to right with a moving
teal shimmer. Not a filled block — a thin line with a gradient sweep.

### `splittext-reveal` (GSAP — homepage headline only)
```ts
// splittext-reveal
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
gsap.registerPlugin(SplitText)

const split = new SplitText(headingRef.current, { type: 'chars' })
gsap.from(split.chars, {
  opacity: 0, y: 20,
  stagger: 0.025,
  duration: 0.5,
  ease: 'power3.out'
})
```

---

## Smooth Scroll Setup

Write this component and use it in `app/layout.tsx`.

```tsx
// lib/smooth-scroll.tsx
'use client'
import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
  return <>{children}</>
}
```

---

## Component Specs

### `BlobTag`
Used for blob names, hashes, merkle roots — any technical ID.
- Font: `var(--font-mono)`, 11–12px
- Background: `var(--bg-subtle)`
- Border: `1px solid var(--border)`
- Shape: pill (`border-radius: 999px`), padding `2px 8px`
- Color: `var(--text-secondary)`
- Long values truncated in the middle (not end): `abc123…xyz789`
- Click to copy → brief checkmark icon flash using `fade-up-reveal`

### `VerifiedBadge`
- Verified: teal dot + "Verified" text, `var(--accent)` color
- Unverified: muted dot + "Unverified", `var(--text-tertiary)` color
- Teal dot plays `verification-pulse` once on mount when verified

### `ReceiptCard`
- Background: `var(--bg-surface)`
- Border: `1px solid var(--border)`
- On hover: border → `var(--border-hover)`, background → `var(--bg-elevated)`
- Transition: `all 0.15s ease`
- No drop shadows
- Verified receipts: border → `var(--border-accent)`

### `ChunkSourceRow`
Inside receipt detail, sources section.
- Chunk index badge (monospace, small)
- Document name
- Similarity score as a thin percentage bar (teal fill, `--bg-subtle` track)
- Blob name → `BlobTag`
- Merkle root → `BlobTag` (truncated)
- Expand on click to show full chunk text in a `<pre>` code block

### Empty States
Every empty state needs:
- SVG illustration (abstract: hexagon grid, node graph, or geometric data viz — no icons)
- Headline in `var(--font-display)`, `var(--text-primary)`
- Sub-label in `var(--text-secondary)`
- Single CTA button

---

## Typography

```css
/* Headings — Syne */
.text-display-xl { font-family: var(--font-display); font-size: 56px; font-weight: 700; line-height: 1.05; letter-spacing: -0.03em; }
.text-display-lg { font-family: var(--font-display); font-size: 40px; font-weight: 600; line-height: 1.1;  letter-spacing: -0.025em; }
.text-display-md { font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.2;  letter-spacing: -0.02em; }

/* Body — DM Sans */
.text-body-lg { font-family: var(--font-body); font-size: 18px; line-height: 1.65; }
.text-body-md { font-family: var(--font-body); font-size: 15px; line-height: 1.6; }
.text-body-sm { font-family: var(--font-body); font-size: 13px; line-height: 1.55; }

/* Mono — JetBrains Mono */
.text-mono-md { font-family: var(--font-mono); font-size: 13px; }
.text-mono-sm { font-family: var(--font-mono); font-size: 11px; font-weight: 300; }
```

---

## The Two Rules That Matter Most

**1. Never `#000000`. Use `--bg-base: #0e1011`.**
Pure black kills your gradients and glows — they have nowhere to live.
The warm-dark bias of `#0e1011` gives depth to every teal accent and tonal layer.

**2. Never `#ffffff`. Use `--text-primary: #e3e2e2`.**
Same logic. The slight warmth is what separates premium dark mode from default dark mode.

These two swaps alone account for half the quality difference between AI template and studio output.
