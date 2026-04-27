import SwiftUI

// ContentView is the root coordinator.
//
// Three modes:
//   1. Discovery   — scan for Windows devices on the local network
//   2. Offline     — standalone note app via WKWebView (no connection needed)
//   3. Connected   — full-screen MJPEG stream from Windows (StreamView)

struct ContentView: View {

    @StateObject private var discovery = DiscoveryService()
    @StateObject private var stream    = StreamService()

    @State private var offlineMode = false
    @State private var devServerURL: String? = nil

    var body: some View {
        ZStack {
            if stream.isConnected {
                connectedView

            } else if stream.isConnecting {
                connectingView

            } else if offlineMode {
                offlineView

            } else {
                discoveryView
            }
        }
        .onAppear {
            discovery.start()
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .onDisappear {
            discovery.stop()
            stream.disconnect()
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }

    // ── Connected ─────────────────────────────────────────────────────────────

    @ViewBuilder
    private var connectedView: some View {
        ZStack {
            StreamView(stream: stream)

            VStack(spacing: 0) {
                // Status pill — top-right
                HStack {
                    Spacer()
                    statusPill
                }
                Spacer()
                // Full toolbar — bottom of screen
                ConnectedToolbarView(stream: stream)
            }
        }
    }

    private var statusPill: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(.green)
                .frame(width: 6, height: 6)
            Text(stream.hostName)
                .font(.caption2)
                .foregroundColor(.secondary)
            if stream.latency > 0 {
                Text("\(Int(stream.latency))ms")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            Button {
                stream.disconnect()
                offlineMode = false
                discovery.start()
            } label: {
                Text("✕")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(.ultraThinMaterial, in: Capsule())
        .padding(.top, 8)
        .padding(.trailing, 12)
    }

    // ── Connecting ────────────────────────────────────────────────────────────

    private var connectingView: some View {
        VStack(spacing: 16) {
            ProgressView().scaleEffect(1.5)
            Text("Connecting…")
                .font(.title2)
                .foregroundColor(.secondary)
        }
    }

    // ── Offline ───────────────────────────────────────────────────────────────

    @ViewBuilder
    private var offlineView: some View {
        ZStack(alignment: .topTrailing) {
            WebAppView(devServerURL: devServerURL)

            // Back button to return to device list
            Button {
                offlineMode = false
                devServerURL = nil
            } label: {
                Label("Devices", systemImage: "wifi")
                    .font(.caption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.ultraThinMaterial, in: Capsule())
            }
            .padding(.top, 8)
            .padding(.trailing, 12)
            .foregroundColor(.accentColor)
        }
    }

    // ── Discovery ─────────────────────────────────────────────────────────────

    private var discoveryView: some View {
        DeviceListView(discovery: discovery) { device in
            discovery.stop()
            connectTo(device: device)
        } onOffline: {
            devServerURL = nil
            offlineMode = true
        } onDevServer: { url in
            devServerURL = url
            offlineMode = true
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    // ── Connected toolbar ─────────────────────────────────────────────────────

    // Shown at the bottom in connected mode. Mirrors tool/color/size state into
    // the hidden Electron window via StreamService action messages.

    private struct ConnectedToolbarView: View {
        @ObservedObject var stream: StreamService

        var body: some View {
            HStack(spacing: 14) {

                // Tool: Pen / Eraser
                HStack(spacing: 4) {
                    CTToolBtn(systemImage: "pencil",
                              active: stream.currentTool == "pen")    { stream.sendToolChange("pen") }
                    CTToolBtn(systemImage: "eraser",
                              active: stream.currentTool == "eraser") { stream.sendToolChange("eraser") }
                }

                CTDivider()

                // Color palette
                HStack(spacing: 6) {
                    ForEach(stream.colors, id: \.self) { hex in
                        CTColorBtn(hex: hex, active: stream.currentColor == hex) {
                            stream.sendColorChange(hex)
                        }
                    }
                }

                CTDivider()

                // Size picker
                HStack(spacing: 8) {
                    ForEach(stream.sizes, id: \.self) { size in
                        CTSizeBtn(size: size, active: stream.currentSize == size) {
                            stream.sendSizeChange(size)
                        }
                    }
                }

                CTDivider()

                // Undo / Redo
                HStack(spacing: 4) {
                    CTIconBtn(systemImage: "arrow.uturn.backward") { stream.sendUndo() }
                    CTIconBtn(systemImage: "arrow.uturn.forward")  { stream.sendRedo() }
                }

                CTDivider()

                // Page navigation
                HStack(spacing: 4) {
                    CTIconBtn(systemImage: "chevron.left") {
                        stream.sendPageSwitch(to: stream.currentPage - 1)
                    }
                    .disabled(stream.currentPage == 0)

                    Text("\(stream.currentPage + 1) / \(stream.pageCount)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .frame(minWidth: 52)

                    CTIconBtn(systemImage: "chevron.right") {
                        stream.sendPageSwitch(to: stream.currentPage + 1)
                    }
                    .disabled(stream.currentPage >= stream.pageCount - 1)

                    CTIconBtn(systemImage: "plus") { stream.sendPageAdd() }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial)
        }
    }

    // MARK: Toolbar sub-components (prefixed CT to avoid collision)

    private struct CTDivider: View {
        var body: some View { Divider().frame(height: 24) }
    }

    private struct CTToolBtn: View {
        let systemImage: String
        let active: Bool
        let action: () -> Void
        var body: some View {
            Button(action: action) {
                Image(systemName: systemImage)
                    .font(.system(size: 15, weight: .medium))
                    .frame(width: 34, height: 30)
                    .background(active ? Color.blue : Color.clear)
                    .foregroundColor(active ? .white : .primary)
                    .cornerRadius(7)
            }
            .buttonStyle(.plain)
        }
    }

    private struct CTColorBtn: View {
        let hex: String
        let active: Bool
        let action: () -> Void
        var body: some View {
            Button(action: action) {
                Circle()
                    .fill(Color(hex: hex))
                    .frame(width: 22, height: 22)
                    .overlay(Circle()
                        .stroke(active ? Color.primary : Color.clear, lineWidth: 2.5)
                        .padding(-2))
                    .shadow(color: .black.opacity(0.25), radius: 1, x: 0, y: 1)
            }
            .buttonStyle(.plain)
        }
    }

    private struct CTSizeBtn: View {
        let size: Double
        let active: Bool
        let action: () -> Void
        private var dot: CGFloat { min(CGFloat(size) * 3.5, 20) }
        var body: some View {
            Button(action: action) {
                ZStack {
                    Circle()
                        .stroke(active ? Color.blue : Color.gray.opacity(0.4), lineWidth: 1.5)
                        .frame(width: 26, height: 26)
                    Circle()
                        .fill(Color.primary)
                        .frame(width: dot, height: dot)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private struct CTIconBtn: View {
        let systemImage: String
        let action: () -> Void
        var body: some View {
            Button(action: action) {
                Image(systemName: systemImage)
                    .font(.system(size: 14))
                    .frame(width: 30, height: 30)
                    .foregroundColor(.primary)
            }
            .buttonStyle(.plain)
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private func connectTo(device: Device) {
        // Resolve mDNS endpoint to a hostname and port, then connect StreamService
        var host = ""
        var port = 8080

        // Extract host/port from NWEndpoint
        switch device.endpoint {
        case .hostPort(let h, let p):
            host = "\(h)"
            port = Int(p.rawValue)
        case .service(let name, _, let domain, _):
            // Fall back to .local hostname resolution
            let clean = name
                .replacingOccurrences(of: "iPad-Canvas-", with: "")
                .replacingOccurrences(of: " ", with: "-")
            host = "\(clean).\(domain.isEmpty ? "local" : domain)"
        default:
            return
        }

        stream.connect(host: host, port: port)
    }
}
