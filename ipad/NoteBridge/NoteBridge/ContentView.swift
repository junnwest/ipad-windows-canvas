import SwiftUI

struct ContentView: View {
    @StateObject private var discovery = DiscoveryService()
    @StateObject private var connection = ConnectionService()

    var body: some View {
        ZStack {
            if connection.isConnected {
                // Drawing mode
                CanvasViewRepresentable(connectionService: connection)
                    .ignoresSafeArea()

                // Status overlay (top)
                VStack {
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
                }
            } else if connection.isConnecting {
                // Connecting state
                VStack(spacing: 16) {
                    ProgressView()
                        .scaleEffect(1.5)
                    Text("Connecting...")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }
            } else {
                // Discovery mode
                DeviceListView(discovery: discovery) { device in
                    connection.connect(to: device)
                }
            }
        }
        .onAppear {
            discovery.start()
            // Keep screen on while app is active
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .onDisappear {
            discovery.stop()
            connection.disconnect()
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }
}
