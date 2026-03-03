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

struct ImageElement: Codable {
    let id: String
    let x: Double       // normalized 0.0-1.0 (top-left x, fraction of page width)
    let y: Double       // normalized 0.0-1.0 (top-left y, fraction of page height)
    let width: Double   // fraction of page width
    let height: Double  // fraction of page height
    let src: String     // "data:image/jpeg;base64,..."
}

struct TextElement: Codable {
    let id: String
    let x: Double       // normalized 0.0-1.0 (fraction of canvas width)
    let y: Double       // normalized 0.0-1.0 (fraction of canvas height)
    let content: String
    let fontSize: Double // fraction of canvas height (e.g. 0.04)
    let color: String   // hex color string e.g. "#000000"
}

// Received from desktop — full page state including strokes and layout config
struct PageStateMessage: Codable {
    let type: String
    let currentPage: Int
    let pageCount: Int
    let pageSize: String?          // e.g. "a4-landscape" — nil in old protocol versions
    let template: String?          // e.g. "blank", "dotted" — nil in old protocol versions
    let strokes: [StrokeData]?     // full authoritative stroke list for the current page
    let texts: [TextElement]?      // text elements on the current page
    let images: [ImageElement]?    // image elements on the current page
}

// Outgoing: undo, redo, page_switch, page_add, erase_at
// Note: page_switch uses "page" to match desktop websocket.js handler
struct ActionMessage: Codable {
    let type: String
    var page: Int?      // page_switch index
    var x: Double?      // erase_at normalized x
    var y: Double?      // erase_at normalized y
}
