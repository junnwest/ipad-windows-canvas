import SwiftUI

struct CanvasViewRepresentable: UIViewRepresentable {
    let connectionService: ConnectionService
    let toolState: ToolState
    let currentPage: Int   // changing this value triggers updateUIView → clearForPageSwitch

    // Coordinator is created once and survives SwiftUI rebuilds.
    // It registers the onPageState callback so desktop→iPad sync works.
    func makeCoordinator() -> Coordinator {
        Coordinator(connectionService: connectionService)
    }

    func makeUIView(context: Context) -> DrawingCanvasView {
        let canvas = DrawingCanvasView()
        canvas.connectionService = connectionService
        canvas.toolState = toolState
        context.coordinator.canvas = canvas   // give coordinator the canvas ref
        // Expose page capture so the toolbar Share button can reach the canvas
        connectionService.capturePageImage = { [weak canvas] in canvas?.exportPageImage() }
        return canvas
    }

    func updateUIView(_ uiView: DrawingCanvasView, context: Context) {
        // Clear local preview whenever the active page index changes
        if context.coordinator.lastPage != currentPage {
            context.coordinator.lastPage = currentPage
            uiView.clearForPageSwitch()
        }
    }

    // MARK: - Coordinator

    class Coordinator {
        weak var canvas: DrawingCanvasView?
        var lastPage: Int = -1   // -1 so the initial page always triggers a clear

        init(connectionService: ConnectionService) {
            // Register once; fires on main thread whenever desktop sends page_state
            connectionService.onPageState = { [weak self] ps in
                self?.canvas?.loadPageState(ps)
            }
        }
    }
}
