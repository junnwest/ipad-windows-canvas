import Foundation

struct StrokePoint: Codable {
    let x: Double        // 0.0-1.0 normalized
    let y: Double        // 0.0-1.0 normalized
    let pressure: Double // 0.0-1.0
    let timestamp: Double
}

struct StrokeData: Codable {
    let id: String
    let points: [StrokePoint]
    let color: String
    let width: Double
    let tool: String
}

struct StrokeMessage: Codable {
    let type: String
    let stroke: StrokeData
}

struct SimpleMessage: Codable {
    let type: String
    var timestamp: Double?
    var strokeId: String?
}

struct WelcomeMessage: Codable {
    let type: String
    let deviceName: String
    let version: String
    let timestamp: Double
}

// Received from desktop when page state changes
struct PageStateMessage: Codable {
    let type: String
    let currentPage: Int
    let pageCount: Int
}

// Outgoing: undo, redo, page_switch, page_add, erase_at
// Note: page_switch uses "page" to match desktop websocket.js handler
struct ActionMessage: Codable {
    let type: String
    var page: Int?      // page_switch index
    var x: Double?      // erase_at normalized x
    var y: Double?      // erase_at normalized y
}
