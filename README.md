# iPad Windows Canvas

Real-time handwriting from iPad to desktop. Draw with Apple Pencil on iPad, see it instantly on your computer.

## Current Progress (Phase 0 - Proof of Concept)

| Step | Description | Status |
|------|-------------|--------|
| 0.1 | Desktop app with drawable canvas | Done |
| 0.2 | iPad app with PencilKit drawing | Done |
| 0.3 | mDNS network discovery | Done (both sides) |
| 0.4 | WebSocket connection | Done (both sides) |
| 0.5 | Stroke data transmission | Done |
| 0.6 | Latency optimization | Not started |

**Tested on real hardware:** iPad→Mac drawing works with 9-13ms latency over WiFi. Pressure sensitivity works on both devices. Connection stable.

## Architecture

```
iPad (Apple Pencil input)  --WebSocket-->  Desktop (canvas display)
        client                                    server
```

- iPad captures pen strokes via PencilKit, sends normalized (0-1) coordinates over WebSocket
- Desktop receives strokes, converts to pixel coordinates, renders on HTML5 Canvas
- Devices find each other via mDNS (`_ipadcanvas._tcp`) on the local network

## How to Run

### Prerequisites

- **Mac** with Node.js and Xcode installed
- **iPad** with Apple Pencil (for testing the iPad app)
- Both devices on the **same WiFi network**

Install Node.js if you don't have it:
```bash
brew install node
```

### 1. Desktop App (Electron)

```bash
cd desktop
npm install
```

Launch the app:
```bash
unset ELECTRON_RUN_AS_NODE && npx electron . --dev
```

> **Why `unset ELECTRON_RUN_AS_NODE`?** If you're launching from VSCode's terminal, VSCode (an Electron app itself) sets this variable, which breaks Electron. Always unset it first.

You should see a window with a dark toolbar ("iPad Canvas") and a white canvas. You can draw on it with your mouse/trackpad to verify it works.

### 2. Test Client (simulates iPad without a real iPad)

With the desktop app running, open a second terminal:
```bash
cd desktop
node test-client.js
```

This connects to the desktop app and draws a diagonal line and a circle. You should see them appear in the desktop window. It also measures latency (expect ~2ms on localhost).

### 3. iPad App (Swift/SwiftUI)

The iPad app must be built and deployed via Xcode. You **cannot** just copy Swift files to the iPad - iOS apps need to be compiled and code-signed through Xcode.

#### One-time setup

1. **Open Xcode** and create a new project:
   - File > New > Project
   - Choose **App** (under iOS)
   - Product Name: `NoteBridge`
   - Team: select your Apple Developer account
   - Organization Identifier: e.g. `com.yourname`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Save it inside the `ipad/` folder

2. **Delete the auto-generated files** that Xcode creates (`ContentView.swift`, etc.) from the Xcode project navigator (choose "Move to Trash")

3. **Add the existing source files** to the project:
   - Right-click the `NoteBridge` group in the project navigator
   - "Add Files to NoteBridge..."
   - Select all `.swift` files from `ipad/NoteBridge/` and its subfolders (`Models/`, `Views/`, `Services/`)
   - Make sure "Copy items if needed" is **unchecked** (files are already in place)

4. **Add required capabilities** in the project settings:
   - Select the project in the navigator > Signing & Capabilities
   - Add **Bonjour Services**: `_ipadcanvas._tcp`
   - This allows the app to discover the desktop via mDNS

5. **Add network permissions** to `Info.plist`:
   - `NSLocalNetworkUsageDescription`: "NoteBridge needs local network access to connect to your desktop computer."
   - `NSBonjourServices`: `["_ipadcanvas._tcp."]`

#### Building and running on iPad

1. **Connect your iPad** to your Mac via USB (or use wireless debugging if set up)
2. In Xcode, select your iPad as the run destination (top toolbar)
3. **Trust the developer** on iPad: Settings > General > VPN & Device Management > trust your developer certificate (first time only)
4. Press **Cmd+R** to build and run
5. The app will show a list of discovered desktop computers
6. Tap to connect, then draw with Apple Pencil

> **Note:** You need an Apple Developer account ($99/year) to deploy to a physical iPad. Free accounts work but apps expire after 7 days.

#### Every time you want to test

1. Start the desktop app first (`unset ELECTRON_RUN_AS_NODE && npx electron . --dev`)
2. Open Xcode and run the iPad app (Cmd+R)
3. On the iPad, tap the discovered desktop to connect
4. Draw with Apple Pencil - strokes should appear on the desktop

## Project Structure

```
ipad-windows-canvas/
├── desktop/                     # Electron desktop app
│   ├── package.json
│   ├── test-client.js           # WebSocket test simulator
│   └── src/
│       ├── main.js              # Electron main process
│       ├── preload.js           # IPC bridge
│       ├── renderer/
│       │   ├── index.html       # UI
│       │   ├── app.js           # Renderer logic
│       │   ├── canvas.js        # Canvas drawing engine
│       │   └── styles.css
│       ├── services/
│       │   ├── websocket.js     # WebSocket server (port 8080)
│       │   └── discovery.js     # mDNS broadcast
│       └── utils/
│           ├── config.js        # Constants
│           └── logger.js
│
└── ipad/                        # Swift iPad app
    └── NoteBridge/
        ├── NoteBridgeApp.swift  # App entry point
        ├── ContentView.swift    # Main UI coordinator
        ├── Models/
        │   ├── Stroke.swift     # Stroke/point data structures
        │   └── Device.swift     # Discovered device model
        ├── Views/
        │   ├── CanvasViewRepresentable.swift  # SwiftUI wrapper
        │   ├── DrawingCanvasView.swift        # UIKit drawing canvas
        │   └── DeviceListView.swift           # Device list UI
        └── Services/
            ├── ConnectionService.swift  # WebSocket client
            └── DiscoveryService.swift   # mDNS browser
```

## Tech Stack

- **Desktop:** Electron, HTML5 Canvas, WebSocket (`ws`), mDNS (`bonjour-service`)
- **iPad:** Swift, SwiftUI, PencilKit, `Network.framework`, `URLSessionWebSocketTask`
- **Protocol:** JSON over WebSocket, mDNS for discovery
