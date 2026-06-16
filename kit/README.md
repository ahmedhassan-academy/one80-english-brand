# One80 English — brand kit (Gradient sweep)

The chosen direction: a **U-turn swoosh** in an **indigo → teal** gradient — the 180° turnaround / transformation rendered literally.

## Colors
| Role | Hex |
|------|-----|
| Gradient start (indigo) | `#5B2EFF` |
| Gradient end (teal) | `#16C5C0` |
| Wordmark ink | `#101024` |
| "English" descriptor | `#6B6B7A` |
| On dark — start / end | `#8A6BFF` / `#2BE0D8` |

Type: **Poppins** — "One" weight 500, "80" weight 700 (gradient), "ENGLISH" weight 500, tracked caps.

## Source (SVG — scalable, editable)
- `lockup-horizontal.svg` — primary lockup (icon + wordmark)
- `lockup-stacked.svg` — centered stacked lockup
- `icon.svg` — icon-only mark (transparent)
- `app-tile.svg` — rounded-square app icon (gradient bg + white mark)
- `mono-black.svg` — single-color black (light backgrounds, print, fax)
- `mono-white.svg` — single-color white knockout (dark backgrounds)
- `kit.html` — contact sheet (open in a browser)

## Exports (`png/`)
- `app-icon-1024 / 512 / 192.png`, `apple-touch-icon-180.png` — app stores / PWA / iOS
- `icon-512 / 48 / 32 / 16.png` — favicons (transparent)
- `lockup-horizontal-1600.png`, `lockup-stacked-900.png` — web/docs (transparent)
- `mono-black-1600.png`, `mono-white-1600.png` — single-color (transparent)

## Web usage
```html
<link rel="icon" type="image/png" sizes="32x32" href="/png/icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/png/icon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/png/apple-touch-icon-180.png">
```

## Notes
- All marks read in one color and scale to favicon size.
- `favicon.ico` wasn't assembled (no ImageMagick/Pillow on the build machine) — the PNG favicons above cover modern browsers; generate `.ico` later with `magick png/icon-16.png png/icon-32.png png/icon-48.png png/favicon.ico` if you need legacy support.
- For final production, consider licensing a display face (Circular, Gotham, Geomanist) in place of Poppins.
