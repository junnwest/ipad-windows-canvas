import SwiftUI

struct ToolbarView: View {
    @ObservedObject var toolState: ToolState
    @ObservedObject var connection: ConnectionService

    var body: some View {
        HStack(spacing: 14) {

            // Tool: Pen / Eraser
            HStack(spacing: 4) {
                ToolToggleBtn(label: "Pen",    systemImage: "pencil",
                              active: toolState.currentTool == "pen")    { toolState.currentTool = "pen" }
                ToolToggleBtn(label: "Eraser", systemImage: "eraser",
                              active: toolState.currentTool == "eraser") { toolState.currentTool = "eraser" }
            }

            ToolDivider()

            // Color palette
            HStack(spacing: 6) {
                ForEach(toolState.colors, id: \.self) { hex in
                    ColorSwatchBtn(hex: hex, active: toolState.currentColor == hex) {
                        toolState.currentColor = hex
                        toolState.currentTool  = "pen"   // auto-switch to pen on color tap
                    }
                }
            }

            ToolDivider()

            // Size picker
            HStack(spacing: 8) {
                ForEach(toolState.sizes, id: \.self) { size in
                    SizeDotBtn(size: size, active: toolState.currentSize == size) {
                        toolState.currentSize = size
                        toolState.currentTool = "pen"
                    }
                }
            }

            ToolDivider()

            // Undo / Redo
            HStack(spacing: 4) {
                IconBtn(systemImage: "arrow.uturn.backward", label: "Undo") { connection.sendUndo() }
                IconBtn(systemImage: "arrow.uturn.forward",  label: "Redo") { connection.sendRedo() }
            }

            ToolDivider()

            // Page navigation
            HStack(spacing: 4) {
                IconBtn(systemImage: "chevron.left", label: "Prev") {
                    connection.sendPageSwitch(to: connection.currentPage - 1)
                }
                .disabled(connection.currentPage == 0)

                Text("Page \(connection.currentPage + 1) / \(connection.pageCount)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .frame(minWidth: 64)
                    .multilineTextAlignment(.center)

                IconBtn(systemImage: "chevron.right", label: "Next") {
                    connection.sendPageSwitch(to: connection.currentPage + 1)
                }
                .disabled(connection.currentPage >= connection.pageCount - 1)

                IconBtn(systemImage: "plus", label: "Add page") { connection.sendPageAdd() }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
    }
}

// MARK: - Sub-components

private struct ToolDivider: View {
    var body: some View {
        Divider().frame(height: 24)
    }
}

private struct ToolToggleBtn: View {
    let label: String
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

private struct ColorSwatchBtn: View {
    let hex: String
    let active: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Circle()
                .fill(Color(hex: hex))
                .frame(width: 22, height: 22)
                .overlay(
                    Circle()
                        .stroke(active ? Color.primary : Color.clear, lineWidth: 2.5)
                        .padding(-2)
                )
                .shadow(color: .black.opacity(0.25), radius: 1, x: 0, y: 1)
        }
        .buttonStyle(.plain)
    }
}

private struct SizeDotBtn: View {
    let size: Double
    let active: Bool
    let action: () -> Void

    private var dotDiameter: CGFloat { min(CGFloat(size) * 3.5, 20) }

    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .stroke(active ? Color.blue : Color.gray.opacity(0.4), lineWidth: 1.5)
                    .frame(width: 26, height: 26)
                Circle()
                    .fill(Color.primary)
                    .frame(width: dotDiameter, height: dotDiameter)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct IconBtn: View {
    let systemImage: String
    let label: String
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

// MARK: - Color helpers

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        self.init(
            red:   Double((int >> 16) & 0xFF) / 255,
            green: Double((int >> 8)  & 0xFF) / 255,
            blue:  Double( int        & 0xFF) / 255
        )
    }
}
