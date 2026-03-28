# iPad Windows Canvas

Turn your iPad into a seamless second screen for Windows. Draw with Apple Pencil, interact with your Windows workflow, and move your mouse between screens — all while the iPad app looks and feels like a native iOS app.

---

## Vision

The iPad acts as a second monitor for a Windows PC, but with a key distinction from a traditional second monitor:

- The **Windows app** looks like a Windows app — native desktop UI, Windows conventions
- The **iPad app** looks like an iPad app — iOS aesthetics, touch-optimized, works standalone
- When connected, the iPad app becomes a live projection of a Windows-rendered view that looks **identical** to the standalone iPad app
- The Windows mouse cursor can move off the right edge of the screen and appear on the iPad, exactly like a dual-monitor setup — no driver required

The user should never feel a difference between the connected and disconnected iPad experience. The only thing that changes when connected is that the Windows mouse cursor can enter the iPad screen and both the Windows user and iPad user can interact simultaneously.

---

## Architecture

### The Two Apps

**Windows App (Electron)**
- Main interface for the Windows user — Windows-native look and feel
- Contains a hidden background window sized to iPad resolution that renders the iPad-facing web app
- This hidden window is captured and streamed as MJPEG frames over WebSocket to the iPad
- Receives touch and Apple Pencil events from the iPad, processes them, and the updated stream is what the iPad sees
- A low-level mouse hook detects when the cursor reaches the right edge of the screen and transfers control to the iPad

**iPad App (Swift + WKWebView)**
- **Offline mode:** loads the shared web app locally in `WKWebView` — fully functional standalone note app, no connection needed
- **Connected mode:** drops `WKWebView`, displays the MJPEG stream from Windows full-screen
- Sends Apple Pencil and touch events to Windows, which renders the result and streams back
- Displays a cursor overlay showing the Windows mouse position when it is on the iPad screen

**Shared Web App (HTML/CSS/JS)**
- The note-taking UI — canvas, toolbar, pages — built with iOS aesthetics (large touch targets, iOS-style typography)
- Runs in `WKWebView` on iPad (offline) and in the hidden Electron window on Windows (connected)
- Because it is the same code in both cases, the connected and disconnected views are visually identical

### System Diagram

```
┌─────────────────────────────────┐        ┌──────────────────────────────┐
│         Windows PC              │        │           iPad               │
│                                 │        │                              │
│  ┌──────────────────────────┐   │        │  ┌────────────────────────┐  │
│  │   Windows App (Electron) │   │        │  │     iPad App (Swift)   │  │
│  │   - Windows-native UI    │   │        │  │                        │  │
│  │   - Note canvas          │   │        │  │  Offline: WKWebView    │  │
│  └──────────────────────────┘   │        │  │  (shared web app)      │  │
│                                 │        │  │                        │  │
│  ┌──────────────────────────┐   │  MJPEG │  │  Connected: MJPEG      │  │
│  │  Hidden iPad View Window │──────────────▶│  stream (full-screen)  │  │
│  │  (shared web app,        │   │  stream│  │                        │  │
│  │   iPad resolution)       │◀──────────────│  Touch / Pencil events │  │
│  └──────────────────────────┘   │  events│  └────────────────────────┘  │
│                                 │        │                              │
│  Mouse edge detection:          │        │  Cursor overlay shown        │
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
| Cursor entry to iPad | Software edge detection | A low-level Windows mouse hook detects when the cursor hits the right screen edge and transfers control to the iPad. Achieves the same UX as a virtual display driver with no driver installation required. A virtual display driver (e.g. `parsec-vdd`) can be added later to enable dragging arbitrary Windows apps to the iPad |
| iPad UI technology | Shared web app in WKWebView | Guarantees visual identity between connected and disconnected modes. iOS feel is achieved through CSS design (iOS-style typography, large touch targets), not native SwiftUI components |
| Drawing latency (Phase 1) | Accept round-trip latency | iPad touch → Windows processes → streams back = ~10–20ms on local WiFi. Acceptable for Phase 1. Phase 2 will add client-side prediction (local preview stroke on iPad, replaced by authoritative stream frame) |

---

## WebSocket Protocol

### Desktop → iPad

| Message | Payload | Description |
|---|---|---|
| `welcome` | `{ deviceName, version, timestamp }` | Sent on connection |
| `pong` | `{ timestamp }` | Heartbeat response |
| `screen_frame` | `{ data: base64-JPEG, width, height }` | MJPEG frame of iPad view |
| `cursor_pos` | `{ x, y }` | Normalized (0–1) cursor position; x=-1 to hide |

### iPad → Desktop

| Message | Payload | Description |
|---|---|---|
| `ping` | `{ timestamp }` | Heartbeat (every 5s) |
| `touch_event` | `{ action, x, y, pressure }` | Touch or Apple Pencil input — `action`: `down`/`move`/`up`, coords normalized 0–1 |
| `action` | `{ action, ...payload }` | Toolbar/page commands — `undo`, `redo`, `page_add`, `page_switch` |

> `clipboard` and `mouse_event` are planned for Phase 2.

---

## Build Phases

### Phase 0 — Proof of Concept (complete)
iPad draws with Apple Pencil → strokes appear on desktop in real time over WebSocket. mDNS discovery, pressure sensitivity, SQLite storage, undo/redo, multi-page notebooks. Tested at 9–13ms latency over WiFi.

### Phase 1 — Second Screen MVP (implemented, pending hardware test)
- Shared web app (`shared/`) — iOS-optimized note canvas running in both WKWebView and Electron
- Hidden Electron window (1366×1024) renders the shared web app and is captured at 30fps via `webContents.capturePage()`
- Frames encoded as JPEG and broadcast over WebSocket as `screen_frame` messages
- iPad connected mode: full-screen MJPEG stream display (`StreamView`)
- iPad offline mode: shared web app loaded locally in `WKWebView` (`WebAppView`)
- Touch and Apple Pencil events forwarded to hidden window via `webContents.sendInputEvent()`
- Basic cursor edge detection via `screen.getCursorScreenPoint()` polling — cursor shown in stream
- Phase 1 uses only cross-platform Electron APIs — **testable on macOS**, no Windows device required

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
- Node.js (v18+) and Electron installed
- iPad with Xcode-deployed NoteBridge app
- Both devices on the same WiFi network

### Desktop app (macOS or Windows)

```bash
cd desktop
npm install
unset ELECTRON_RUN_AS_NODE && npx electron . --dev
```

> **VSCode terminal:** VSCode sets `ELECTRON_RUN_AS_NODE` which breaks Electron. Always `unset` it first.

The Windows app window opens. A second hidden window (the iPad view) is created in the background and begins streaming to any connected iPad.

### iPad app

1. Open `ipad/NoteBridge/NoteBridge.xcodeproj` in Xcode
2. Ensure the `shared/` folder was added as a **folder reference** (blue icon) — required for offline mode
3. Select your iPad as the run target and press **Cmd+R**
4. On the iPad: tap a discovered device to connect, or tap **Use Offline** for standalone mode

---

## Project Structure

```
ipad-windows-canvas/
├── desktop/                        # Electron Windows app
│   ├── package.json
│   ├── test-client.js              # WebSocket test simulator
│   └── src/
│       ├── main.js                 # Electron main process
│       ├── preload.js              # IPC bridge (context isolation)
│       ├── renderer/               # Windows app UI (Windows-native look)
│       │   ├── index.html
│       │   ├── app.js
│       │   ├── canvas.js           # HTML5 canvas drawing engine
│       │   └── styles.css
│       ├── services/
│       │   ├── websocket.js        # WebSocket server (port 8080)
│       │   ├── discovery.js        # mDNS broadcast (_ipadcanvas._tcp)
│       │   ├── capture.js          # Hidden window capture + MJPEG streaming
│       │   └── storage.js          # SQLite notebook persistence
│       └── utils/
│           ├── config.js
│           └── logger.js
│
├── shared/                         # Shared web app (runs on both platforms)
│   ├── index.html                  # iPad-optimized note canvas UI
│   ├── app.js
│   ├── canvas.js
│   └── styles.css                  # iOS-style CSS
│
└── ipad/                           # Swift iPad app
    └── NoteBridge/
        ├── NoteBridgeApp.swift
        ├── ContentView.swift       # Switches between WKWebView and stream
        ├── Models/
        ├── Views/
        │   ├── StreamView.swift    # MJPEG stream display (connected)
        │   └── WebAppView.swift    # WKWebView wrapper (offline)
        └── Services/
            ├── ConnectionService.swift
            ├── DiscoveryService.swift
            └── StreamService.swift # MJPEG frame decoder
```

---

## Tech Stack

- **Windows app:** Electron, HTML5 Canvas, WebSocket (`ws`), mDNS (`bonjour-service`), `webContents.capturePage()` for screen capture, `webContents.sendInputEvent()` for input injection
- **Shared web app:** HTML/CSS/JS, iOS-style design, runs in both WKWebView and Electron
- **iPad app:** Swift, SwiftUI, `WKWebView`, `URLSessionWebSocketTask`, `Network.framework` (mDNS)
- **Protocol:** JSON + MJPEG over WebSocket, mDNS for discovery
- **Storage:** SQLite (`better-sqlite3`) on Windows

---

## Environment Notes

- Node.js via Homebrew: `/opt/homebrew/bin/node` (v25+)
- Electron v40+
- **VSCode terminal quirk:** VSCode sets `ELECTRON_RUN_AS_NODE` which breaks Electron. Always launch with: `unset ELECTRON_RUN_AS_NODE && npx electron . --dev`
- WebSocket port: 8080
- mDNS service type: `_ipadcanvas._tcp`
