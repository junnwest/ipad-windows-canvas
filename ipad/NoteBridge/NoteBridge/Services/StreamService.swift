import Foundation
import UIKit
import Combine

// StreamService manages the WebSocket connection for Phase 1 second-screen mode.
// It receives MJPEG frames from the Windows hidden iPad view window and sends
// touch/pencil events and toolbar actions back.

class StreamService: ObservableObject {

    // ── Published state ───────────────────────────────────────────────────────

    @Published var isConnected  = false
    @Published var isConnecting = false
    @Published var hostName     = ""
    @Published var latency: Double = 0

    // Latest decoded frame from the Windows stream
    @Published var currentFrame: UIImage? = nil

    // Tool state — mirrored into the hidden Electron window via action messages
    @Published var currentTool:  String = "pen"
    @Published var currentColor: String = "#1a1a1a"
    @Published var currentSize:  Double = 2.0

    // Page state — updated from page_state messages sent by the desktop
    @Published var currentPage: Int = 0
    @Published var pageCount:   Int = 1

    let colors: [String] = ["#1a1a1a", "#e53935", "#1e88e5", "#43a047", "#fb8c00"]
    let sizes:  [Double] = [2, 5, 10]

    // ── Internal ──────────────────────────────────────────────────────────────

    private var webSocketTask: URLSessionWebSocketTask?
    private var session = URLSession(configuration: .default)
    private var pingTimer: Timer?
    private var pingStart: Double = 0

    // ── Connection ────────────────────────────────────────────────────────────

    func connect(host: String, port: Int) {
        guard !isConnected, !isConnecting else { return }
        isConnecting = true

        guard let url = URL(string: "ws://\(host):\(port)") else {
            isConnecting = false
            return
        }

        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        receive()

        // Start heartbeat
        pingTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            self?.sendPing()
        }
    }

    func disconnect() {
        pingTimer?.invalidate()
        pingTimer = nil
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        DispatchQueue.main.async {
            self.isConnected  = false
            self.isConnecting = false
            self.currentFrame = nil
        }
    }

    // ── Receive loop ──────────────────────────────────────────────────────────

    private func receive() {
        webSocketTask?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handleMessage(text)
                    }
                @unknown default: break
                }
                self.receive() // keep listening

            case .failure:
                DispatchQueue.main.async { self.disconnect() }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String
        else { return }

        switch type {
        case "welcome":
            DispatchQueue.main.async {
                self.hostName     = json["deviceName"] as? String ?? ""
                self.isConnected  = true
                self.isConnecting = false
            }

        case "page_state":
            if let pg  = json["currentPage"] as? Int,
               let cnt = json["pageCount"]   as? Int {
                DispatchQueue.main.async {
                    self.currentPage = pg
                    self.pageCount   = cnt
                }
            }

        case "pong":
            let now = Date().timeIntervalSince1970 * 1000
            DispatchQueue.main.async {
                self.latency = now - self.pingStart
            }

        case "screen_frame":
            guard let base64 = json["data"] as? String,
                  let imageData = Data(base64Encoded: base64),
                  let image = UIImage(data: imageData)
            else { return }
            DispatchQueue.main.async {
                self.currentFrame = image
            }

        // cursor_pos is drawn into the stream frames by the Electron hidden window,
        // so no additional handling needed on the Swift side for Phase 1.
        case "cursor_pos":
            break

        default:
            break
        }
    }

    // ── Outgoing messages ─────────────────────────────────────────────────────

    func sendUndo()    { sendAction("undo") }
    func sendRedo()    { sendAction("redo") }
    func sendPageAdd() { sendAction("page_add") }

    func sendPageSwitch(to index: Int) {
        sendAction("page_switch", payload: ["page": index])
    }

    func sendToolChange(_ tool: String) {
        currentTool = tool
        sendAction("tool_change", payload: ["tool": tool])
    }

    func sendColorChange(_ color: String) {
        currentColor = color
        currentTool  = "pen"
        sendAction("color_change", payload: ["color": color])
    }

    func sendSizeChange(_ size: Double) {
        currentSize = size
        sendAction("size_change", payload: ["size": size])
    }

    // Send touch or Apple Pencil input
    // action: "down" | "move" | "up"
    // x, y: normalized 0–1 coordinates
    // pressure: 0–1 (Apple Pencil force)
    func sendTouchEvent(action: String, x: CGFloat, y: CGFloat, pressure: CGFloat = 0.5) {
        let msg: [String: Any] = [
            "type": "touch_event",
            "action": action,
            "x": Double(x),
            "y": Double(y),
            "pressure": Double(pressure),
        ]
        send(msg)
    }

    // Send toolbar / page actions
    func sendAction(_ action: String, payload: [String: Any] = [:]) {
        var msg = payload
        msg["type"]   = "action"
        msg["action"] = action
        send(msg)
    }

    private func sendPing() {
        pingStart = Date().timeIntervalSince1970 * 1000
        send(["type": "ping", "timestamp": pingStart])
    }

    private func send(_ dict: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let text = String(data: data, encoding: .utf8)
        else { return }
        webSocketTask?.send(.string(text)) { _ in }
    }
}
