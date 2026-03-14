# SankalpHub — Adaptive Logo Placement Instructions
## For Claude Code: Use correct logo variant based on background

---

## STEP 1 — Save Both SVG Variants

First, save these two files into the `public/` folder:

| File | Use When |
|------|----------|
| `public/sankalphub-logo-dark.svg` | Background is dark (navy, black, dark grey) |
| `public/sankalphub-logo-light.svg` | Background is light (white, cream, light grey) |
| `public/sankalphub-icon.svg` | Icon only — favicon, small contexts |

**Rename the existing files:**
```bash
# In your project root:
cp public/sankalphub-logo.svg public/sankalphub-logo-dark.svg
```

Then save the light version below as `public/sankalphub-logo-light.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 140" width="560" height="140">
  <defs>
    <linearGradient id="diaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A87C30"/>
      <stop offset="100%" style="stop-color:#7C5B20"/>
    </linearGradient>
    <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C9A96E"/>
      <stop offset="100%" style="stop-color:#8B6520"/>
    </linearGradient>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- NO background rect — transparent, works on any light surface -->

  <!-- Orbital rings -->
  <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" stroke-width="0.8" opacity="0.25" transform="rotate(-40 70 70)"/>
  <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" stroke-width="0.8" opacity="0.38" transform="rotate(20 70 70)"/>
  <ellipse cx="70" cy="70" rx="56" ry="20" fill="none" stroke="#C9A96E" stroke-width="0.8" opacity="0.18" transform="rotate(80 70 70)"/>

  <!-- Diamond outer -->
  <polygon points="70,16 112,70 70,120 28,70" fill="none" stroke="url(#diaGrad)" stroke-width="1.1" opacity="0.5"/>
  <!-- Diamond mid -->
  <polygon points="70,30 100,70 70,106 40,70" fill="none" stroke="url(#diaGrad)" stroke-width="1" opacity="0.85"/>
  <!-- Diamond inner -->
  <polygon points="70,44 94,70 70,92 46,70" fill="none" stroke="url(#diaGrad)" stroke-width="1.5"/>

  <!-- Orbital nodes -->
  <circle cx="70"  cy="10"  r="3.5" fill="url(#nodeGrad)" filter="url(#softglow)"/>
  <circle cx="118" cy="86"  r="2.5" fill="url(#nodeGrad)" opacity="0.65"/>
  <circle cx="22"  cy="86"  r="2.5" fill="url(#nodeGrad)" opacity="0.65"/>

  <!-- Node connectors -->
  <line x1="70" y1="10" x2="70" y2="44"  stroke="#C9A96E" stroke-width="0.5" opacity="0.25"/>
  <line x1="118" y1="86" x2="94" y2="70" stroke="#C9A96E" stroke-width="0.5" opacity="0.18"/>
  <line x1="22"  y1="86" x2="46" y2="70" stroke="#C9A96E" stroke-width="0.5" opacity="0.18"/>

  <!-- Center hub -->
  <circle cx="70" cy="70" r="10"  fill="none" stroke="#C9A96E" stroke-width="0.7" opacity="0.4"/>
  <circle cx="70" cy="70" r="5.5" fill="url(#diaGrad)" filter="url(#softglow)"/>
  <circle cx="70" cy="70" r="2.2" fill="#FAF8F4"/>

  <!-- Divider -->
  <line x1="142" y1="26" x2="142" y2="114" stroke="#C9A96E" stroke-width="0.5" opacity="0.2"/>

  <!-- Wordmark — dark text on light bg -->
  <text font-family="Georgia,'Times New Roman',serif" font-size="52" font-weight="700" letter-spacing="0">
    <tspan x="160" y="84" fill="#1A1208">Sankalp</tspan><tspan fill="#9A7035">Hub</tspan>
  </text>

  <!-- Underline -->
  <line x1="160" y1="94" x2="538" y2="94" stroke="#C9A96E" stroke-width="0.4" opacity="0.25"/>

  <!-- Tagline -->
  <text x="162" y="112"
        font-family="Arial,Helvetica,sans-serif"
        font-size="9" font-weight="300"
        letter-spacing="4.5"
        fill="#BBA878">PRODUCTION INTELLIGENCE PLATFORM</text>
</svg>
```

---

## STEP 2 — Create a Reusable Logo Component

Create this component at `components/SankalpHubLogo.tsx`:

```tsx
// components/SankalpHubLogo.tsx
// Automatically serves the correct logo based on background variant prop

interface LogoProps {
  variant?: 'dark' | 'light' | 'auto';
  height?: number;
  className?: string;
}

export default function SankalpHubLogo({
  variant = 'dark',
  height = 52,
  className = '',
}: LogoProps) {
  const src =
    variant === 'light'
      ? '/sankalphub-logo-light.svg'
      : '/sankalphub-logo-dark.svg';

  return (
    <img
      src={src}
      alt="SankalpHub"
      height={height}
      className={className}
      style={{ display: 'block' }}
    />
  );
}
```

---

## STEP 3 — Apply Per Location

Go through every place the logo appears and apply the correct variant.
Use the table below as your guide:

### Rule Table

| Location | Background | Use Variant | Height |
|----------|-----------|-------------|--------|
| Main navbar / sidebar | Dark navy | `variant="dark"` | `52` |
| Login / Auth page | Dark background | `variant="dark"` | `80` |
| Registration page | Dark background | `variant="dark"` | `80` |
| Dashboard header | Dark navbar | `variant="dark"` | `48` |
| Email templates | White | `variant="light"` | `60` |
| PDF / Print reports | White | `variant="light"` | `60` |
| Landing page hero | Dark section | `variant="dark"` | `64` |
| Landing page light section | White/Cream | `variant="light"` | `56` |
| Settings page | Light background | `variant="light"` | `48` |
| Modal headers | White modal bg | `variant="light"` | `44` |
| Favicon / Browser tab | — | icon only | 32px |

---

## STEP 4 — Usage Examples

### Dark Navbar (most common)
```tsx
import SankalpHubLogo from '@/components/SankalpHubLogo';

// In your Navbar component:
<SankalpHubLogo variant="dark" height={52} />
```

### Light Background (settings, modals, reports)
```tsx
<SankalpHubLogo variant="light" height={48} />
```

### Login / Auth Page (centered)
```tsx
<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
  <SankalpHubLogo variant="dark" height={72} />
</div>
```

### Plain img tag (if not using the component)
```html
<!-- On dark background -->
<img src="/sankalphub-logo-dark.svg"  alt="SankalpHub" height="52" />

<!-- On light background -->
<img src="/sankalphub-logo-light.svg" alt="SankalpHub" height="52" />
```

---

## STEP 5 — Favicon Setup

In `app/layout.tsx` (Next.js App Router):

```tsx
export const metadata = {
  title: 'SankalpHub',
  description: 'Production Intelligence Platform',
  icons: {
    icon: '/sankalphub-icon.svg',
    apple: '/sankalphub-icon.svg',
  },
};
```

Or directly in the `<head>`:
```html
<link rel="icon" type="image/svg+xml" href="/sankalphub-icon.svg" />
```

---

## STEP 6 — Search & Replace Checklist

Search the entire codebase for any old logo references and update:

- [ ] Search for `sankalphub-logo.svg` → replace with correct dark/light variant
- [ ] Search for any plain text `"SankalpHub"` used as a visible heading → replace with `<SankalpHubLogo />`
- [ ] Search for any old logo image files → remove and replace
- [ ] Confirm favicon is set in `app/layout.tsx`
- [ ] Confirm navbar uses `variant="dark"`
- [ ] Confirm any white/light page sections use `variant="light"`

---

## Quick Reference — Which Variant?

```
Background colour          →  Logo variant
─────────────────────────────────────────
#060810  (midnight)        →  dark
#0D1420  (deep navy)       →  dark
#0F172A  (slate 900)       →  dark
#1E293B  (slate 800)       →  dark
Any dark colour            →  dark

#FFFFFF  (white)           →  light
#F8FAFC  (slate 50)        →  light
#FAF8F4  (cream)           →  light
#F1F5F9  (slate 100)       →  light
Any light/white colour     →  light
```

---

*SankalpHub — Adaptive Logo System*
*Two variants: dark background + light background*
*One reusable component handles both*
