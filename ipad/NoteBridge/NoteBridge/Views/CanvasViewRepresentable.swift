import SwiftUI

struct CanvasViewRepresentable: UIViewRepresentable {
    let connectionService: ConnectionService
    let toolState: ToolState

    func makeUIView(context: Context) -> DrawingCanvasView {
        let canvas = DrawingCanvasView()
        canvas.connectionService = connectionService
        canvas.toolState = toolState
        return canvas
    }

    func updateUIView(_ uiView: DrawingCanvasView, context: Context) {
        // Canvas manages its own state; page-switch clearing is handled by ContentView
    }
}
