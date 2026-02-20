import SwiftUI

struct ContentView: View {
    @StateObject private var discovery  = DiscoveryService()
    @StateObject private var connection = ConnectionService()
    @StateObject private var toolState  = ToolState()

    // Reference to the canvas so we can clear it on page switch
    @State private var canvasView: DrawingCanvasView? = nil

    var body: some View {
        ZStack {
            if connection.isConnected {
                // Full-screen canvas
                CanvasViewRepresentable(connectionService: connection, toolState: toolState)
                    .ignoresSafeArea()
                    .onAppear { /* canvas ref set via coordinator if needed */ }

                // Top status bar + bottom toolbar overlay
                VStack(spacing: 0) {
                    // Status bar
                    HStack {
                        Circle()
                            .fill(.green)
                            .frame(width: 8, height: 8)
                        Text(connection.hostName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        if connection.latency > 0 {
                            Text("\(Int(connection.latency))ms")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Button("Disconnect") {
                            connection.disconnect()
                            discovery.start()
                        }
                        .font(.caption)
                        .foregroundColor(.red)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial)

                    Spacer()

                    // Tool + page toolbar
                    ToolbarView(toolState: toolState, connection: connection)
                }

            } else if connection.isConnecting {
                VStack(spacing: 16) {
                    ProgressView().scaleEffect(1.5)
                    Text("Connecting...")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
            } else {
                DeviceListView(discovery: discovery) { device in
                    // Wire toolState into connection before connecting
                    connection.toolState = toolState
                    connection.connect(to: device)
                }
            }
        }
        .onAppear {
            discovery.start()
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .onDisappear {
            discovery.stop()
            connection.disconnect()
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }
}
