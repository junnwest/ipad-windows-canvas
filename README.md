# NoteBridge

Turn your iPad into a seamless second screen for Windows. Draw with Apple Pencil, interact with your Windows workflow, and move your mouse between screens — all while the iPad app looks and feels like a native iOS app.

---

## Vision

The iPad acts as a second monitor for a Windows PC, but with a key distinction from a traditional second monitor:

- The **Windows app** looks like a Windows app — native Ribbon-style desktop UI, Windows conventions
- The **iPad app** looks like an iPad app — iOS aesthetics, touch-optimized, works standalone
- When connected, the iPad app becomes a live projection of a Windows-rendered view that looks **identical** to the standalone iPad app
- The Windows mouse cursor can move off the right edge of the screen and appear on the iPad, exactly like a dual-monitor setup — no driver required

The user should never feel a difference between the connected and disconnected iPad experience. The only thing that changes when connected is that the Windows mouse cursor can enter the iPad screen and both the Windows user and iPad user can interact simultaneously.

---

## Architecture

### The Two Apps

**Windows App (Electron)**
- Main interface for the Windows user — Windows-native Ribbon-style UI
- Pen, eraser, and text tools; color palette; stroke size picker; undo/redo
- Full notebook management: create, rename, delete; multiple page sizes (A4, Letter, Square) and templates (blank, dotted, squared, ruled, Cornell, 3-column)
- Image insertion (JPEG/PNG, downscaled to 1200 px max); PDF export via PDFKit
- SQLite persistence (`better-sqlite3`) with automatic one-time migration from the legacy JSON format
- Contains a hidden background window that renders the shared web app in **full-canvas electron-mode** (all shared-app UI chrome hidden — the iOS SwiftUI toolbar handles controls in connected mode)
- The hidden window's dimensions are set dynamically when the iPad sends its screen size on connect, so the canvas maps 1-to-1 with the iPad screen
- This hidden window is captured at 30 fps and broadcast as MJPEG frames over WebSocket to the iPad
- Receives touch and Apple Pencil events from the iPad; injected via a direct JS bridge (`window.iPadPointerInput`) that preserves Apple Pencil pressure — bypasses `sendInputEvent` which is mouse-only
- Software edge detection polls the cursor position and activates iPad mode when the cursor reaches the right edge of the primary display

**iPad App (Swift + SwiftUI)**
- **Offline mode:** loads the shared web app locally in `WKWebView` — fully functional standalone note app, no connection needed
- **Dev Server mode:** loads the shared web app from a URL entered by the user (for fast iteration during development)
- **Connected mode:** drops `WKWebView`, displays the MJPEG stream from Windows full-screen with a native SwiftUI overlay toolbar
- The connected toolbar mirrors tool, color, size, undo/redo, and page navigation state into the hidden Electron window via `action` messages
- A status pill in the top-right shows the host name, live latency, and a disconnect button
- Sends Apple Pencil and touch events to Windows, which renders the result and streams back
- mDNS discovery via `Network.framework` — finds Windows hosts automatically on the local network

**Shared Web App (HTML/CSS/JS)**
- Full multi-screen note-taking app — Library (notebook grid/shelf), Canvas (drawing), Settings — built with the NoteBridge design system: warm paper aesthetic, floating glass toolbar, Newsreader typography
- Three screens: **Library** (notebook list with grid and shelf views, search), **Canvas** (drawing with floating glass toolbar, pen well, page nav pill), **Settings** (two-column layout, 6 sections)
- Four modals: new notebook, pages overview, share, connection
- Runs in `WKWebView` on iPad (offline/dev server) and in the hidden Electron window on Windows (connected)
- In **connected mode**, the app runs in `electron-mode`: all UI chrome is hidden and only the canvas is streamed — the SwiftUI toolbar handles controls
- In **offline/dev-server mode**, the full Library → Canvas → Settings UI is visible and functional
- Because it is the same rendering code in both cases, the canvas view is visually identical whether connected or offline

### System Diagram

```
┌─────────────────────────────────┐        ┌──────────────────────────────┐
│         Windows PC              │        │           iPad               │
│                                 │        │                              │
│  ┌──────────────────────────┐   │        │  ┌────────────────────────┐  │
│  │   Windows App (Electron) │   │        │  │     iPad App (Swift)   │  │
│  │   - Ribbon-style UI      │   │        │  │                        │  │
│  │   - Notebook management  │   │        │  │  Offline: WKWebView    │  │
│  │   - PDF export           │   │        │  │  (shared web app)      │  │
│  └──────────────────────────┘   │        │  │                        │  │
│                                 │        │  │  Connected: MJPEG      │  │
│  ┌──────────────────────────┐   │  MJPEG │  │  stream + SwiftUI      │  │
│  │  Hidden iPad View Window │──────────────▶│  toolbar overlay       │  │
│  │  (shared web app,        │   │  stream│  │                        │  │
│  │   1366×1024)             │◀──────────────│  Touch / Pencil events │  │
│  └──────────────────────────┘   │  events│  └────────────────────────┘  │
│                                 │        │                              │
│  Cursor edge detection:         │        │  Cursor overlay shown        │
│  cursor exits right edge ──────────────────▶ on iPad screen            │
└─────────────────────────────────┘        └──────────────────────────────┘

Both apps communicate over WebSocket (port 8080) on local WiFi
Devices discover each other via mDNS (_ipadcanvas._tcp)
```

### Why This Approach

The central challenge was making the connected and disconnected iPad views look **identical**. If the iPad used native SwiftUI and Windows tried to replicate that in HTML/CSS, they would inevitably diverge. The solution is to use the same rendering technology in both places — a shared web app that runs in `WKWebView` on iPad (offline) and in a hidden Electron window on Windows (connected, streamed back). Because it is literally the same code, appearance is guaranteed to match.

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Platform | Windows first, macOS later | DXGI capture is GPU-level (~1ms), significantly faster than CoreGraphics. macOS expansion is clean — same Electron + WebSocket + iPad stack, just swap the platform-specific capture and input injection modules behind a common interface |
| Screen streaming protocol | MJPEG over WebSocket | Sufficient for local WiFi (100–300 Mbps). Every frame is independent, simple to implement. WebRTC (with inter-frame compression) can be added later as an optimization without changing the transport layer |
| Cursor entry to iPad | Software edge detection | Polls `screen.getCursorScreenPoint()` at 60 Hz and activates iPad mode when the cursor hits the right screen edge. Achieves the same UX as a virtual display driver with no driver installation required. A virtual display driver (e.g. `parsec-vdd`) can be added later to enable dragging arbitrary Windows apps to the iPad |
| iPad UI technology | Shared web app in WKWebView | Guarantees visual identity between connected and disconnected modes. iOS feel is achieved through CSS design (iOS-style typography, large touch targets), not native SwiftUI components |
| Drawing latency (Phase 1) | Accept round-trip latency | iPad touch → Windows processes → streams back = ~10–20ms on local WiFi. Acceptable for Phase 1. Phase 2 will add client-side prediction (local preview stroke on iPad, replaced by authoritative stream frame) |

---

## WebSocket Protocol

### Desktop → iPad

| Message | Payload | Description |
|---|---|---|
| `welcome` | `{ deviceName, version, timestamp }` | Sent on connection |
| `pong` | `{ timestamp }` | Heartbeat response |
| `screen_frame` | `{ data: base64-JPEG, width, height }` | MJPEG frame of iPad view (30 fps, quality 65) |
| `cursor_pos` | `{ x, y }` | Normalized (0–1) cursor position; x=-1 to hide |
| `page_state` | `{ ... }` | Full page state broadcast (strokes, texts, images) when desktop switches pages or undoes |

### iPad → Desktop

| Message | Payload | Description |
|---|---|---|
| `ping` | `{ timestamp }` | Heartbeat (every 5 s) |
| `device_info` | `{ screenWidth, screenHeight }` | iPad logical screen size in points — sent once on connect; Windows resizes hidden window to match |
| `touch_event` | `{ action, x, y, pressure }` | Touch or Apple Pencil input — `action`: `down`/`move`/`up`, coords normalized 0–1, pressure 0–1 |
| `action` | `{ action, ...payload }` | Toolbar commands — `undo`, `redo`, `page_switch` (+ `page`), `page_add`, `tool_change` (+ `tool`), `color_change` (+ `color`), `size_change` (+ `size`) |

#### Legacy Phase 0 messages (still active)

| Message | Direction | Description |
|---|---|---|
| `stroke_update` | iPad→Desktop | Incremental stroke data during a draw gesture |
| `stroke_complete` | iPad→Desktop | Stroke committed; persist to notebook |
| `erase_at` | iPad→Desktop | Erase at normalized coordinate |
| `page_switch` | iPad→Desktop | Switch to page index |
| `page_add` | iPad→Desktop | Append a new page |

> `clipboard` and `mouse_event` are planned for Phase 2.

---

## Build Phases

### Phase 0 — Proof of Concept (complete)
iPad draws with Apple Pencil → strokes appear on desktop in real time over WebSocket. mDNS discovery, pressure sensitivity, SQLite storage, undo/redo, multi-page notebooks. Tested at 9–13 ms latency over WiFi.

### Phase 1 — Second Screen MVP (hardware-tested; core issues fixed)

**Verified working:**
- mDNS discovery, WebSocket connection, latency display
- MJPEG stream displays correctly on iPad
- Drawing on iPad appears in stream and on Windows canvas
- Toolbar actions (tool, color, size, undo, redo, page add) sync both directions
- PDF export, image insertion, notebook management on Windows

**Fixed after first hardware test:**
- Hidden window now runs in **electron-mode** (all shared-app UI chrome hidden; canvas fills full window)
- Hidden window **dynamically resizes** to match iPad screen dimensions on connect — fixes 1:1 scale and aspect ratio
- Touch input uses **direct JS bridge** (`window.iPadPointerInput`) instead of `sendInputEvent` — Apple Pencil pressure now reaches the canvas
- `StreamView` uses `.fit` (not `.fill`) to prevent cropping when dimensions don't match yet
- Added missing `ipad-view:erase_at` IPC handler so eraser syncs to the Windows canvas

**Known issues (next session):**
- **Cursor x always 0** — cursor enters iPad screen at the left edge only; cannot move horizontally. Fix requires cursor warping (`SetCursorPos` on Windows / `CGWarpMouseCursorPosition` on macOS) — needs a native module (`robotjs` or `@nut-tree/nut-js`).
- **Eraser visual inconsistency** — shared canvas uses pixel-level (`destination-out`) erasure; desktop uses stroke-proximity erasure. They look different. Fix requires refactoring the shared canvas eraser to use stroke-proximity (with a proper undo stack entry for erased strokes).
- **Quick strokes → dots / smooth strokes → straight lines** — inherent to the round-trip protocol (WiFi latency reduces point density). Fix is client-side prediction (Phase 2): draw a local preview stroke on the iPad immediately, replace it with the authoritative stream frame when it arrives.
- **Shared web app UI not visible in connected mode** — in connected mode the iPad shows the MJPEG stream (canvas only) with the native SwiftUI toolbar; the new Library/Settings/modal UI is only accessible in offline or dev-server mode.

### Phase 2 — Input Polish
- Client-side prediction: iPad draws local preview stroke immediately, replaced by stream frame (eliminates perceived drawing latency)
- Simultaneous input: iPad user and Windows mouse interact on the same canvas without conflict
- Clipboard sync: copy on Windows, paste on iPad and vice versa

### Phase 3 — Virtual Display
- Install `parsec-vdd` (virtual display driver) as an optional enhancement
- Windows OS recognizes iPad as a real second monitor
- Enables dragging arbitrary Windows apps to the iPad screen, not just the note app

### Phase 4 — macOS Support
- Abstract platform-specific modules: screen capture (`DXGI` → `CoreGraphics`), input injection (`SendInput` → `CGEvent`)
- All other layers (WebSocket, streaming, iPad app) reused unchanged

---

## How to Run

### Prerequisites
- Node.js (v18+) and npm
- iPad with Xcode-deployed NoteBridge app
- Both devices on the same WiFi network

### Desktop app

```powershell
cd desktop
npm install
npm run dev
```

> **VSCode terminal:** VSCode sets `ELECTRON_RUN_AS_NODE` which breaks Electron. If `npm run dev` fails, launch from a standalone terminal instead of the VSCode integrated terminal.

The NoteBridge window opens. A second hidden window (the iPad view) is created in the background and begins streaming to any connected iPad.

### iPad app

1. Open `ipad/NoteBridge/NoteBridge.xcodeproj` in Xcode
2. Ensure the `shared/` folder was added as a **folder reference** (blue icon) — required for offline mode
3. Select your iPad as the run target and press **Cmd+R**
4. On the iPad: tap a discovered device to connect, tap **Use Offline** for standalone mode, or tap **Dev Server** to load from a local dev server URL

---

## Development Workflow (no Mac required after initial deploy)

Changes to `shared/` (canvas, UI, toolbar, styles) can be tested on the iPad instantly without rebuilding or touching Xcode.

### One-time setup
Deploy the iPad app from Xcode once (requires Mac). After that, the Mac is only needed when Swift files change.

### Every dev session (Windows only)

**1. Find your Windows IP**
```powershell
ipconfig
# Look for IPv4 Address under your WiFi adapter, e.g. 192.168.1.42
```

**2. Start the dev server**
```powershell
cd desktop
npm run serve-shared
# Serves shared/ at http://192.168.1.42:3000
```

**3. Connect iPad**

On the iPad: open NoteBridge → tap **Dev Server** → enter `http://192.168.1.42:3000` → Connect.

The URL is saved — you only type it once per IP change.

**4. Make changes**

Edit any file in `shared/` on Windows. Refresh the iPad (pull down or navigate back and tap Dev Server again) to see changes immediately.

### When you do need Xcode again
Only when Swift files change (`ContentView.swift`, `StreamService.swift`, `DeviceListView.swift`, etc.):
1. `git push` on Windows
2. `git pull` on Mac → Cmd+R in Xcode to redeploy

---

## Project Structure

```
ipad-windows-canvas/
├── desktop/                        # Electron Windows app
│   ├── package.json
│   ├── test-client.js              # WebSocket test simulator
│   └── src/
│       ├── main.js                 # Electron main process
│       ├── preload.js              # IPC bridge for main renderer window
│       ├── preload-ipad.js         # IPC bridge for hidden iPad view window
│       ├── renderer/               # Windows app UI (Ribbon-style)
│       │   ├── index.html          # Ribbon toolbar, canvas, modals
│       │   ├── app.js              # App bootstrap, IPC, connection status
│       │   ├── canvas.js           # HTML5 canvas drawing engine
│       │   ├── history.js          # Undo/redo history
│       │   ├── tools.js            # Tool/color/size state
│       │   ├── notebook.js         # Active notebook state + save/load
│       │   ├── notebook-list.js    # Notebook management modal
│       │   ├── page-setup.js       # New notebook / page size+template modal
│       │   ├── pages-overview.js   # Pages grid overview modal
│       │   └── styles.css          # Windows Ribbon-style CSS
│       ├── services/
│       │   ├── websocket.js        # WebSocket server (port 8080)
│       │   ├── discovery.js        # mDNS broadcast (_ipadcanvas._tcp)
│       │   ├── capture.js          # Hidden window capture + MJPEG streaming
│       │   ├── storage.js          # SQLite notebook persistence (better-sqlite3)
│       │   └── export.js           # PDF export (PDFKit)
│       └── utils/
│           ├── config.js
│           └── logger.js
│
├── shared/                         # Shared web app — source of truth
│   ├── index.html                  # Library, Canvas, Settings screens + modal container
│   ├── app.js                      # Bridge, screen routing, all UI logic (Library/Canvas/Settings/Modals)
│   ├── canvas.js                   # CanvasEngine (drawing, pages, undo/redo) — do not edit
│   └── styles.css                  # NoteBridge design system CSS (warm paper, glass toolbar)
│
│   ⚠️  ipad/NoteBridge/shared/ is a separate Xcode-bundled copy of these files.
│       After editing shared/, copy the changed files there too (or the iPad offline
│       mode will run stale code until the Xcode project is rebuilt).
│
├── design_handoff_notebridge/      # Design reference (React+Babel prototypes, read-only)
│   ├── NoteBridge.html
│   ├── design-system.jsx
│   ├── app.jsx
│   └── screens/                    # library.jsx, canvas.jsx, modals.jsx, settings.jsx
│
└── ipad/                           # Swift iPad app
    └── NoteBridge/
        ├── NoteBridgeApp.swift
        ├── ContentView.swift       # Root coordinator; switches between discovery / offline / connected
        ├── Models/
        │   ├── Device.swift        # mDNS device model
        │   ├── Stroke.swift        # Stroke data model
        │   └── ToolState.swift     # Tool/color/size state
        ├── Views/
        │   ├── DeviceListView.swift        # mDNS device list + offline/dev server entry
        │   ├── StreamView.swift            # MJPEG stream display (connected)
        │   ├── WebAppView.swift            # WKWebView wrapper (offline/dev server)
        │   ├── DrawingCanvasView.swift     # PencilKit-based drawing (Phase 0 legacy)
        │   ├── CanvasViewRepresentable.swift
        │   ├── ToolbarView.swift           # Offline toolbar
        │   └── ActivityView.swift
        └── Services/
            ├── ConnectionService.swift
            ├── DiscoveryService.swift      # mDNS browser (Network.framework)
            └── StreamService.swift         # WebSocket client + MJPEG decoder + action senders
```

---

## Tech Stack

- **Windows app:** Electron, HTML5 Canvas, WebSocket (`ws`), mDNS (`bonjour-service`), `webContents.capturePage()` for screen capture, `webContents.sendInputEvent()` for input injection, PDFKit for PDF export
- **Shared web app:** HTML/CSS/JS, iOS-style design, runs in both WKWebView and Electron
- **iPad app:** Swift, SwiftUI, `WKWebView`, `URLSessionWebSocketTask`, `Network.framework` (mDNS)
- **Protocol:** JSON + MJPEG over WebSocket, mDNS for discovery
- **Storage:** SQLite (`better-sqlite3`) on Windows; automatic one-time migration from legacy JSON format

---

## Environment Notes

- Node.js v18+ required; Electron v40+
- **VSCode terminal quirk:** VSCode sets `ELECTRON_RUN_AS_NODE` which breaks Electron. Use `npm run dev` from a standalone terminal if the integrated terminal fails.
- WebSocket port: 8080
- mDNS service type: `_ipadcanvas._tcp`
- Hidden iPad view window: starts at 1366×1024, resized dynamically to match iPad screen on connect
- MJPEG capture: 30 fps, JPEG quality 65, self-throttling (skips frame if previous capture hasn't finished)
- To open DevTools for the hidden window during debugging, add temporarily to `main.js` after `createIPadWindow()`:
  ```js
  if (process.argv.includes('--dev')) ipadWindow.webContents.openDevTools({ mode: 'detach' });
  ```
