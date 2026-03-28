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

    // Whether the user chose to use offline mode
    @State private var offlineMode = false

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
        ZStack(alignment: .topTrailing) {
            StreamView(stream: stream)

            // Minimal status pill — subtle, non-intrusive
            statusPill
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
            WebAppView()

            // Back button to return to device list
            Button {
                offlineMode = false
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
            offlineMode = true
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
