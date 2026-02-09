import SwiftUI

struct CanvasViewRepresentable: UIViewRepresentable {
    let connectionService: ConnectionService

    func makeUIView(context: Context) -> DrawingCanvasView {
        let canvas = DrawingCanvasView()
        canvas.connectionService = connectionService
        return canvas
    }

    func updateUIView(_ uiView: DrawingCanvasView, context: Context) {
        // No updates needed; the canvas manages its own state
    }
}
