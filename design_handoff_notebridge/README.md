# Handoff: NoteBridge

## Overview

NoteBridge is a cross-platform digital notebook app consisting of three surfaces:

1. **Shared Web App Canvas** — a handwriting/annotation canvas served as a web app, rendered on both iPad (via WKWebView or similar) and the Windows desktop app (via WebView2). The canvas is identical on both platforms; the only contextual difference is a connection status pill shown when the iPad is linked to a Windows session.
2. **iPad Native App** — a native SwiftUI shell that hosts the canvas and provides the notebook browser, connection flow, page manager, and notebook setup sheet.
3. **Windows Desktop App** — a native WinUI 3 / Win32 shell that hosts the canvas and provides a notebook browser, ribbon toolbar, and page manager modal.

---

## About the Design Files

The files in this bundle are **design references created as HTML prototypes** — they show the intended visual design and layout but are not production code to ship directly.

Your task is to **recreate these designs in your target codebase** using its established patterns, frameworks, and libraries:
- Canvas web app → HTML/CSS/JS (or any web framework)
- iPad shell → SwiftUI
- Windows shell → WinUI 3 (or WPF/Win32 if that's what the codebase uses)

Open `NoteBridge Hi-Fi.html` in a browser to explore all screens interactively. The design canvas lets you pan, zoom, and click any artboard to fullscreen it. Use the **Tweaks** button (top-right toolbar) to switch accent colors live.

---

## Fidelity

**High-fidelity.** These are pixel-accurate mockups with final colors, typography, spacing, shadows, and interaction patterns. Recreate them as closely as possible using your codebase's existing design system. Where a design system value is close but not exact, prefer the design system value — but flag large deviations.

---

## Design Tokens

All tokens are defined in `hi_primitives.jsx` under the `T` object. Key values:

### Accent Color
| Token | Value | Notes |
|---|---|---|
| `accent` | `#c07850` | Warm Terracotta — primary interactive color |
| `accentBg` | `rgba(192,120,80,0.10)` | Selected/highlighted backgrounds |
| `accentBorder` | `rgba(192,120,80,0.28)` | Subtle accent borders |

### iOS / iPad Light Theme
| Token | Value | Usage |
|---|---|---|
| `bg` | `#ffffff` | Primary background |
| `groupBg` | `#f2f2f7` | Grouped list/sheet backgrounds |
| `label` | `#000000` | Primary text |
| `label2` | `rgba(60,60,67,0.60)` | Secondary text |
| `label3` | `rgba(60,60,67,0.30)` | Tertiary / placeholder text |
| `sep` | `rgba(60,60,67,0.20)` | Separators and hairlines |
| `fill` | `#f2f2f7` | Control fills |
| `fill2` | `#e5e5ea` | Pressed fills |
| `glass` | `rgba(252,250,248,0.80)` | Frosted glass surfaces |
| `glassBlur` | `blur(20px) saturate(1.8)` | Backdrop filter |
| `glassBorder` | `0.5px solid rgba(255,255,255,0.60)` | Glass edge |

### Windows Dark Theme
| Token | Value | Usage |
|---|---|---|
| `wBg` | `#1c1c1c` | App background |
| `wSurface` | `#252525` | Toolbar / panel surfaces |
| `wPanel` | `#2e2e2e` | Secondary panels, modal titlebar |
| `wHover` | `#3a3a3a` | Hover states |
| `wBorder` | `rgba(255,255,255,0.083)` | Subtle borders |
| `wBorderB` | `rgba(255,255,255,0.16)` | Brighter borders |
| `wFg` | `rgba(255,255,255,0.956)` | Primary text |
| `wFgDim` | `rgba(255,255,255,0.54)` | Secondary text |
| `wFgDimmer` | `rgba(255,255,255,0.28)` | Tertiary / disabled text |

### Typography
| Platform | Font Stack |
|---|---|
| iPad / iOS | `-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Helvetica Neue', sans-serif` |
| Windows | `'Segoe UI', 'Segoe UI Variable', system-ui, sans-serif` |

### Shadows
| Token | Value |
|---|---|
| `card` | `0 1px 4px rgba(0,0,0,0.06), 0 6px 18px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06)` |
| `sheet` | `0 -4px 32px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.04)` |
| `pill` | `0 2px 14px rgba(0,0,0,0.32)` |
| `winShadow` | `0 8px 40px rgba(0,0,0,0.5)` |

### Border Radii
| Element | Radius |
|---|---|
| iPad bottom sheet | 20px top corners |
| iPad notebook card | 14px |
| iPad chip/pill | 10px |
| iOS input field | 12px |
| Windows modal | 8px |
| Windows button | 5px |
| Windows notebook card | 6px |
| Connection status pill | 100px (fully round) |

### Notebook Cover Gradients
Six cover gradients (CSS `background`), assigned by notebook index `% 6`:
```
0: linear-gradient(150deg,#547088 0%,#3e5870 100%)  — steel blue
1: linear-gradient(150deg,#6a8a70 0%,#507860 100%)  — forest green
2: linear-gradient(150deg,#7a6070 0%,#624855 100%)  — mauve
3: linear-gradient(150deg,#c07850 0%,#9e5e38 100%)  — terracotta (matches accent)
4: linear-gradient(150deg,#384858 0%,#263445 100%)  — dark navy
5: linear-gradient(150deg,#6a6250 0%,#58503e 100%)  — warm khaki
```
Each card also has a 7px left "spine" accent in the accent color, plus a subtle highlight gradient at the top and a dark shadow strip at the bottom edge of the cover image.

---

## Screens / Views

### SURFACE 1 — Shared Canvas Web App

The canvas renders an infinite (or page-bounded) drawing surface. It is the same HTML loaded on both iPad and Windows.

#### Canvas — Disconnected state

**Layout:** Full viewport. Three zones stacked vertically:
- **Nav bar** (height: 52px iPad / 66px Windows ribbon): frosted glass, `backdrop-filter: blur(20px) saturate(1.8)`, `border-bottom: 0.5px solid sep`
- **Body:** Flex row — Tool Rail (60px wide) + Canvas fill
- **Page bar** (height: 46px): frosted glass, `border-top: 0.5px solid sep`

**Tool Rail** (left side, 60px wide):
- Background: frosted glass (same as nav)
- `border-right: 0.5px solid sep`
- Padding: 14px top, 18px bottom
- Contents (top to bottom):
  - **Pen** tool icon (22px SVG) — selected state: `background: accent×16%, border: 1px solid accent×35%`, border-radius 12px, 44×44px tap target
  - **Eraser** tool icon — unselected: transparent background
  - **Text** tool icon — unselected
  - Divider: 28px wide, 0.5px, `sep` color, margin 10px v
  - **Color swatches** (7 circles stacked vertically, gap 7px): `#1a1a1a, #d63030, #2860d0, #28a050, #df7020, #7838c0, #707070`. Selected: 22×22px, box-shadow `0 0 0 2px #fff, 0 0 0 3.8px accent`. Others: 17×17px, border `1.5px solid rgba(0,0,0,0.10)`
  - Divider
  - **Size dots** (4 circles stacked, gap 9px): diameters 3/5/8/13px, `T.label` color. Selected (index 1, 5px): opacity 0.82, outline `2px solid accent×70%` offset 2px. Others: opacity 0.22
  - `flex: 1` spacer
  - **Undo** icon (38×38px tap target, opacity 0.80)
  - **Redo** icon (38×38px tap target, opacity 0.30 — dimmed)

**Canvas area:**
- Background: `#ffffff`
- Dotted grid overlay: `radial-gradient(circle, rgba(0,0,0,0.65) 1px, transparent 1px)`, `background-size: 22px 22px`, `opacity: 0.14`

**Page bar:**
- Height: 46px
- Left: `‹` chevron (opacity 0.40) + `2 of 8` label (font-size 14, color label2, min-width 52px, centered) + `›` chevron
- Right: **+ Page button** — `background: accent`, border-radius 10px, padding `7px 16px`, font-size 14 semibold, white text, box-shadow `0 2px 10px accent×55%`, with plus icon (14px)

#### Canvas — Connected state

Identical to disconnected, plus one addition:

**Connection Status Pill** — positioned `top: 14px, right: 14px` over the canvas:
- Background: `rgba(18,16,14,0.76)`
- Backdrop-filter: `blur(14px)`
- Border-radius: 100px
- Border: `0.5px solid rgba(255,255,255,0.16)`
- Box-shadow: `0 2px 14px rgba(0,0,0,0.32)`
- Padding: `5px 12px 5px 9px`
- Contents (L→R): green dot (8px, `#34c759`, glow `0 0 6px rgba(52,199,89,0.7)`) + device name (13px, weight 500, white, letter-spacing -0.1px) + latency (12px, `rgba(255,255,255,0.44)`) + `×` dismiss (rgba(255,255,255,0.35))

---

### SURFACE 2 — iPad Native App

#### Screen: Home — Notebook Browser

**Nav area** (large-title style, not a standard nav bar):
- Padding: `14px 20px 10px`
- Title: "Notebooks", font-size 32, weight 700, letter-spacing -0.6px
- Row with title + two right items:
  - **Connect to Windows button**: `background: fill`, border-radius 10px, padding `7px 14px`, `border: 0.5px solid sep`. Gray dot (8px, `label3`) + label "Connect to Windows" (13px, weight 500, label2)
  - **New notebook button**: 36×36px, border-radius 11px, `background: accent`, box-shadow `0 2px 10px accent×55%`, plus icon (18px white)
- Hairline separator below: `0.5px solid sep`

**Notebook grid:**
- Padding: `18px 20px 36px`
- 2-column CSS grid, gap 16px
- Each card: `HiNotebookCard` (see Design Tokens → Cover Gradients above)
  - Width: fills column, height: 240px
  - Border-radius: 14px, box-shadow: `card` token
  - Cover area (62% of height): gradient background
    - Top highlight: `linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)`
    - Left spine: 7px wide, accent color
    - Bottom shadow strip: 12px, `rgba(0,0,0,0.18)`
  - Metadata area (38%): padding `10px 14px 12px`
    - Title: 15px, weight 600, label, letter-spacing -0.2px, single line truncated
    - Pages: 12px, label2
    - Date: 11px, label3, margin-top 1px

---

#### Sheet Pattern (shared by Connect, Page Manager, Setup)

All sheets share this base:
- `position: absolute, bottom: 0, left: 0, right: 0`
- `background: rgba(252,250,248,0.98)`, `backdrop-filter: blur(24px)`
- `border-radius: 20px 20px 22px 22px`
- `box-shadow: 0 -4px 32px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.04)`
- **Handle**: centered div, 36×4px, border-radius 2px, `rgba(60,60,67,0.18)`, padding `10px 0 4px`
- Behind sheet: the screen beneath gets `background: rgba(0,0,0,0.32–0.40)` scrim + `backdrop-filter: blur(2–3px)`

---

#### Sheet: Connect to Windows

**Header** (padding `8px 22px 0`):
- Title: "Connect to Windows", 20px, weight 700, letter-spacing -0.4px
- Right: "Cancel" text button in accent color, 17px

**Subtitle**: "Nearby desktops on your Wi-Fi network", 14px, label2, padding `4px 22px 16px`

**Device list** (`margin: 0 16px`):
- Container: `border-radius: 14px`, `border: 0.5px solid sep`, `background: #fff`, `overflow: hidden`
- Each row: `padding: 14px 16px`, `gap: 14px`, `border-bottom: 0.5px solid sep` (except last)
  - Connecting device row: `background: accent×9%`
  - **Device icon**: 42×36px, border-radius 6px, `fill` background, desktop monitor SVG
  - **Name**: 16px, weight 600, label, letter-spacing -0.2px
  - **Status**: 13px — connecting: accent color; available: label2
  - **Spinner** (connecting): 20×20px circle, `border: 2.5px solid accent`, `border-top-color: transparent`, `animation: spin 0.8s linear infinite`
  - **Chevron** (available): 16px, label3

**Footer**: "Not seeing your PC?" + accent-colored link text, 13px, label3, padding `14px 22px 0`

---

#### Sheet: Page Manager

**Header** (padding `6px 20px 14px`):
- Title: "Pages", 20px, weight 700
- Right: "+ Add Page" button — accent background, border-radius 10px, padding `7px 14px`, 14px semibold white, plus icon 13px

**Page grid** (padding `0 16px`, `overflow-y: auto`):
- 3-column grid, gap 12px
- Each page tile: `border-radius: 12px`, `overflow: hidden`, `background: #fff`
  - Non-selected: `border: 1px solid sep`, `box-shadow: card`
  - Selected (current page): `border: 2px solid accent`, `box-shadow: 0 0 0 3px accent×22%`
  - **Preview area** (height 130px): white background, dotted grid `opacity: 0.10`, spacing 18px
    - Selected badge: 20×20px circle top-right (8px inset), accent background, white ✓ at 12px
  - **Actions area** (padding `8px 10px 10px`): `background: groupBg`
    - Page label: 13px, weight 600, label
    - Action row: equal-width buttons (Copy / Paste ↓ / Delete)
      - `flex: 1`, padding `4px 0`, border-radius 7px, `background: #fff`, `border: 0.5px solid sep`
      - Font: 11px, weight 500; Delete is `#ff3b30`, others label2

---

#### Sheet: Notebook Setup

**Header**: "New Notebook" title + "Create" text button (accent, bold)

**Name field**:
- Container: `background: #fff`, border-radius 12px, `border: 1.5px solid accent`, padding `12px 16px`, `box-shadow: 0 0 0 3px accent×18%`
- Placeholder: 17px, label3

**Page Size** (section label: 13px weight 600 uppercase label2, letter-spacing 0.4px):
- Flex row, gap 8px, wrapping
- Chip: padding `7px 14px`, border-radius 10px
  - Selected: `background: accent×14%`, `border: 1.5px solid accent`, 14px weight 600, accent color
  - Unselected: `background: #fff`, `border: 1px solid sep`, 14px weight 400, label2
- Options: A4 Land. / A4 Port. / Letter Land. / Letter Port. / Square

**Template** (section label same):
- 3-column grid, gap 10px
- Each tile: border-radius 12px, overflow hidden, `background: #fff`
  - Selected: `border: 1.5px solid accent`, `box-shadow: 0 0 0 3px accent×18%`
  - Unselected: `border: 1px solid sep`, `box-shadow: card`
  - **Preview area** (height 68px): `fill` background (selected: `accent×9%`), contains template preview SVG
  - **Label**: centered, 13px, weight 600 if selected (accent) else 400 (label2)
- Options: Blank / Dotted / Squared / Ruled / Cornell / 3-Column

---

### SURFACE 3 — Windows Desktop App

#### Screen: Canvas — Ribbon-Lite

**Window chrome**: title bar 32px, `background: #141414`, macOS-style traffic light dots (for mockup clarity — use Windows close/min/max in production), title "NoteBridge — Physics Notes" in 13px `wFgDim`

**Ribbon** (height: 66px, `background: wSurface`, `border-bottom: 1px solid wBorder`):

Ribbon is a horizontal strip of **groups**, each with:
- Internal padding: `4px 8px 0`
- `border-right: 1px solid wBorder`
- Bottom label: 10px, `wFgDimmer`, `letter-spacing: 0.2px`, padding `3px 0 4px`
- Tool buttons inside: 40px min-width, flex-column icon+label, padding `4px 7px`, border-radius 5px
  - Selected: `background: accent×22%`, `border: 1px solid accent×50%`
  - Icon color: accent if selected, `wFg` if not
  - Label: 10px, accent/semibold if selected, `wFgDim`/regular if not

**Ribbon groups (L→R):**

| Group | Contents |
|---|---|
| File | "Notebooks" button (height 24px) |
| Tools | Pen / Eraser / Text ribbon tools (Pen selected) |
| Colors | 7 color swatches (16px circles, selected: `box-shadow: 0 0 0 1.5px wBg, 0 0 0 3px accent`) |
| Size | 4 size dots (diameters 3/5/8/13px); selected (index 1) opacity 0.88, `outline: 2px solid accent×50%` offset 2 |
| Edit | Undo + Redo ribbon tools (Redo at 30% opacity) |
| Insert | "🖼 Image" + "⬇ Export PDF" stacked buttons (height 22px each) |
| *(spacer)* | `flex: 1` |
| Connection | Connected indicator: `background: rgba(52,199,89,0.14)`, `border: 1px solid rgba(52,199,89,0.3)`, border-radius 6px, padding `4px 10px`. Green dot (8px, glow) + device name (12px weight 600, `wFg`) + latency + hint text (10px, `wFgDim`) |

**Canvas** (flex 1): white, dotted grid overlay `opacity: 0.12`

**Page bar** (height 32px, `background: wSurface`, `border-top: 1px solid wBorder`):
- "← Prev" button (kbd: ←, `dim` styling)
- "Page 2 of 8" label (12px, `wFgDim`, min-width 72px centered)
- "Next →" button
- Divider
- "⊞ Pages" button
- Thin separator (`1px solid wBorderB`)
- "+ Add Page" button — accent fill
- `flex: 1` spacer
- "Saved · Apr 23" (11px, `wFgDimmer`)

**Button spec (Windows):**
- Height: 28px default, 22–26px compact
- Border-radius: 5px
- Border: accent buttons `1px solid accent`; others `1px solid wBorderB`
- Font: Segoe UI, 12px, weight 400 (600 for accent)
- Padding: `0 9px`

---

#### Screen: Windows Home — Grid View

**Toolbar** (height 38px, `background: wSurface`):
- "+ New Notebook" — accent button (height 26px)
- Divider
- View toggle (Grid | List): segmented control, `border: 1px solid wBorderB`, border-radius 5px, overflow hidden. Active segment: `accent×22%` bg, accent text, weight 600. Inactive: `wFgDim`
- Divider
- Search field: 200px, height 24px, `background: wPanel`, `border: 1px solid wBorderB`, border-radius 5px, search icon + placeholder text
- `flex: 1`
- "Sort: Recent ▾" dim button

**Notebook grid** (padding 18px, 4-column grid, gap 14px):
- Each card: `WinNBCard` — width fills column, height includes cover (120px) + metadata
  - Cover: same gradient system as iPad covers
  - Spine: 6px, accent color
  - Metadata: padding `8px 11px 10px`, title 13px weight 600 `wFg`, pages 11px `wFgDim`, date 10px `wFgDimmer`
  - Box-shadow: `0 2px 8px rgba(0,0,0,0.25)`
- Below each card: action row with gap 4, margin-top 5px
  - "Open" — accent button h22 w52
  - "Rename" — default button h22
  - "Delete" — default button h22, color `#ff6060`, border `rgba(255,96,96,0.35)`
- Last cell: dashed placeholder (`border: 1.5px dashed wBorderB`, opacity 0.5)

**Status bar** (height 22px, `background: #141414`):
- "6 notebooks" · "All synced" · (flex spacer) · gray dot + "Not connected to iPad"

---

#### Screen: Windows Page Manager Modal

Shows canvas + ribbon underneath at reduced opacity (0.35), then:

**Scrim**: `background: rgba(0,0,0,0.55)`, `backdrop-filter: blur(2px)`

**Modal** (width 660px, centered):
- `background: wSurface`, `border: 1px solid wBorderB`, border-radius 8px
- `box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`
- **Titlebar** (height 36px, `background: wPanel`, `border-bottom: 1px solid wBorder`):
  - "Pages" — 14px weight 600 `wFg`
  - "+ Add Page" accent button h24
  - Divider
  - "✕" close button h24 w28

**Page grid** (padding 14px, 4-column grid, gap 10px, max-height 380px scrollable):
- Each tile: border-radius 6px, `background: wBg`
  - Non-selected: `border: 1px solid wBorder`
  - Selected (page 2): `border: 1.5px solid accent`, `box-shadow: 0 0 0 2px accent×30%`
  - Preview (height 88px): white, dotted grid `opacity: 0.10`
  - Actions area: `background: wPanel`, padding `5px 7px 8px`
    - Label: 11px weight 600 `wFg`
    - Buttons: Copy / Paste ↓ / ✕ — equal width, `background: wHover`, `border: 1px solid wBorder`, 10px, `wFgDim` (✕ is `#ff6060`)

---

## Interactions & Behavior

### Connect to Windows Flow
1. User taps "Connect to Windows" on iPad home screen
2. Bottom sheet animates up (spring, ~350ms, iOS sheet spring)
3. App begins scanning for nearby Windows instances running NoteBridge
4. Each discovered device appears in the list as "Available"
5. User taps a device → row shows spinning indicator + "Connecting…"
6. On success → sheet dismisses, status pill fades in top-right of canvas
7. Pill shows device name + live latency in ms
8. Tapping `×` on pill disconnects and removes it

### Page Navigation
- Prev/Next buttons navigate pages (keyboard: ← / → on Windows)
- Page count label updates: `{current} of {total}`
- "+ Page" button appends a new blank page using the current template and navigates to it
- On iPad, Pages sheet slides up; on Windows, modal opens centered

### Notebook Setup
- Bottom sheet on iPad / could be a dialog on Windows
- "Create" is disabled until name field has content
- Template selection is single-select; page size is single-select
- On submit: navigate to new notebook canvas (page 1)

### Canvas
- Pen tool: draw strokes. Color and size from tool rail/ribbon selection
- Eraser tool: erase by touch/mouse drag
- Text tool: tap to place a text box
- Undo/Redo: standard stack, keyboard shortcuts Ctrl+Z / Ctrl+Y on Windows, two-finger tap on iPad
- Canvas content syncs between iPad and Windows when connected (real-time or on stroke completion — TBD by engineering)

---

## State Management

Key state variables needed:

```
notebooks: Notebook[]           // list of notebooks
activeNotebook: Notebook | null // currently open notebook
activePage: number              // 1-indexed
totalPages: number

activeTool: 'pen' | 'eraser' | 'text'
activeColor: string             // hex
activeSizeIndex: 0 | 1 | 2 | 3

windowsDevice: Device | null    // null = disconnected
connectionLatency: number | null

sheetOpen: 'connect' | 'pages' | 'setup' | null
```

---

## Assets

No external image assets. All visual elements use:
- CSS gradients for notebook covers
- Inline SVG for icons (Pen, Eraser, Text, Undo, Redo, Pages, Chevrons, Plus, Ellipsis)
- CSS for the dotted canvas grid overlay

All icons are custom SVG shapes defined in `hi_primitives.jsx` — port these to your icon system.

---

## Files in This Bundle

| File | Purpose |
|---|---|
| `NoteBridge Hi-Fi.html` | **Primary reference.** Open in browser. All 9 screens across 3 surfaces, with pan/zoom canvas and live accent color tweaks. |
| `NoteBridge Wireframes.html` | Earlier wireframe exploration (18 artboards). Useful for understanding layout decisions and rejected alternatives. |
| `hi_primitives.jsx` | All design tokens, shared components, icon SVGs |
| `hi_ipad.jsx` | iPad screens: Canvas, Connected Canvas, Home, Connect Sheet, Page Manager, Notebook Setup |
| `hi_windows.jsx` | Windows screens: Canvas with Ribbon, Home Grid, Page Manager Modal |
| `design-canvas.jsx` | Pan/zoom canvas used to present artboards (not part of the product) |

---

*Design produced April 2026. Questions? Refer to the hi-fi mockup first — it is the source of truth.*
