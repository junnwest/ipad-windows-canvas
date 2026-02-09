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
