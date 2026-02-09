import SwiftUI

struct DeviceListView: View {
    @ObservedObject var discovery: DiscoveryService
    let onConnect: (Device) -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("Searching for Desktop...")
                .font(.title2)
                .foregroundColor(.secondary)

            if discovery.devices.isEmpty {
                Text("Make sure the Windows desktop app is running\non the same WiFi network.")
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
        }
    }
}
