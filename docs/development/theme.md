# Theme Spec v1 (EXP Solution vibe)

## Design Tokens
- --primary: #0B2A4A (navy đậm)
- --accent: #1E88E5 (xanh điện)
- --bg: #0F1522 (nền tối xanh 5%)
- --surface: #0F1B2D (thẻ/card)
- --muted: #8AA0B5 (chữ phụ)
- --border: #203045 (viền mảnh)
- --success: #16A34A; --warning: #F59E0B; --danger: #EF4444

Radius
- xl: 16px; 2xl: 20px

Shadows
- elevate: 0 10px 30px rgba(2,8,23,0.35)
- insetlite: inset 0 1px 0 rgba(255,255,255,0.03)

Gradients
- --g1: linear-gradient(135deg, #0B2A4A 0%, #1E88E5 100%)
- --g2: radial-gradient(1200px 600px at 20% -10%, rgba(30,136,229,.25), transparent 60%)

Typography
- Inter, Plus Jakarta Sans, system-ui; weight 400/600/700
- Tracking headline: -0.01em

## Tailwind Config (drop-in)
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)'
      },
      borderRadius: { xl: '16px', '2xl': '20px' },
      boxShadow: {
        elevate: '0 10px 30px rgba(2,8,23,0.35)',
        insetlite: 'inset 0 1px 0 rgba(255,255,255,0.03)'
      }
    }
  },
  plugins: []
} satisfies Config
```

```css
/* app/globals.css */
:root {
  --primary:#0B2A4A; --accent:#1E88E5;
  --bg:#0F1522; --surface:#0F1B2D;
  --muted:#8AA0B5; --border:#203045;
  --success:#16A34A; --warning:#F59E0B; --danger:#EF4444;
  --g1: linear-gradient(135deg,#0B2A4A 0%, #1E88E5 100%);
  --g2: radial-gradient(1200px 600px at 20% -10%, rgba(30,136,229,.25), transparent 60%);
}
html { color-scheme: dark; }
body { background: var(--bg); color: #E6EDF6; font-feature-settings: 'ss01' on; }
```

## Components
- Button, Card, SectionHeader, Hero gradient, ScanPanel, Admin layout (đính kèm trong thư mục `docs/v1.0`).

## Áp dụng vào thiệp mời HTML
- body: dùng `var(--bg)`; thẻ/card: `var(--surface)`; viền: `var(--border)`; nút RSVP: `var(--accent)`.

