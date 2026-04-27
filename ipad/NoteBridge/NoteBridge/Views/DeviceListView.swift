import SwiftUI

struct DeviceListView: View {
    @ObservedObject var discovery: DiscoveryService
    let onConnect: (Device) -> Void
    let onOffline: () -> Void
    let onDevServer: (String) -> Void

    @State private var showingDevServerInput = false
    @State private var devServerInput = UserDefaults.standard.string(forKey: "devServerURL") ?? "http://192.168.1.x:3000"

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.system(size: 60))
                .foregroundColor(.accentColor)

            Text("NoteBridge")
                .font(.largeTitle.bold())

            Text("Searching for desktop…")
                .font(.subheadline)
                .foregroundColor(.secondary)

            if discovery.devices.isEmpty {
                Text("Make sure the desktop app is running\non the same WiFi network.")
                    .font(.callout)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            } else {
                VStack(spacing: 12) {
                    ForEach(discovery.devices) { device in
                        Button(action: { onConnect(device) }) {
                            HStack {
                                Image(systemName: "desktopcomputer")
                                    .font(.title3)
                                Text(device.name)
                                    .font(.headline)
                                Spacer()
                                Image(systemName: "arrow.right.circle.fill")
                                    .font(.title3)
                                    .foregroundColor(.accentColor)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 40)
            }

            Spacer()

            VStack(spacing: 16) {
                Button(action: onOffline) {
                    Label("Use Offline", systemImage: "pencil.and.outline")
                        .font(.callout)
                        .foregroundColor(.secondary)
                }

                Button(action: { showingDevServerInput = true }) {
                    Label("Dev Server", systemImage: "hammer")
                        .font(.callout)
                        .foregroundColor(.secondary.opacity(0.6))
                }
            }
            .padding(.bottom, 32)
        }
        .alert("Dev Server URL", isPresented: $showingDevServerInput) {
            TextField("http://192.168.1.x:3000", text: $devServerInput)
                .keyboardType(.URL)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            Button("Connect") {
                let url = devServerInput.trimmingCharacters(in: .whitespaces)
                UserDefaults.standard.set(url, forKey: "devServerURL")
                onDevServer(url)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Run  npm run serve-shared  in desktop/ on Windows, then enter your Windows IP.")
        }
    }
}
