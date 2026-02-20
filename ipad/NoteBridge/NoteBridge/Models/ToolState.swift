import Foundation
import Combine

class ToolState: ObservableObject {
    @Published var currentTool: String = "pen"    // "pen" | "eraser"
    @Published var currentColor: String = "#000000"
    @Published var currentSize: Double = 2.0

    let colors: [String] = [
        "#000000", "#e53935", "#1e88e5", "#43a047",
        "#fb8c00", "#8e24aa", "#757575"
    ]
    let sizes: [Double] = [1.0, 2.0, 4.0, 8.0]
}
