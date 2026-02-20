import Foundation
import Network
import Combine

class ConnectionService: ObservableObject {
    @Published var isConnected = false
    @Published var isConnecting = false
    @Published var hostName = ""
    @Published var latency: Double = 0
    @Published var currentPage: Int = 0
    @Published var pageCount: Int = 1

    // Set by ContentView so stroke messages carry the selected tool/color/size
    var toolState: ToolState?

    private var webSocket: URLSessionWebSocketTask?
    private let session = URLSession(configuration: .default)
    private var heartbeatTimer: Timer?
    private var pointBuffer: [StrokePoint] = []
    private var currentStrokeId: String?

    private var resolveConnection: NWConnection?

    // MARK: - Connect

    func connect(to device: Device) {
        DispatchQueue.main.async {
            self.isConnecting = true
        }
        print("[Connection] Resolving endpoint for: \(device.name)")

        let params = NWParameters.tcp
        params.requiredInterfaceType = .wifi
        let connection = NWConnection(to: device.endpoint, using: params)
        resolveConnection = connection
        var resolved = false

        connection.stateUpdateHandler = { [weak self] state in
            print("[Connection] NWConnection state: \(state)")
            switch state {
            case .ready:
                guard !resolved else { return }
                resolved = true
                if let innerEndpoint = connection.currentPath?.remoteEndpoint,
                   case .hostPort(let host, let port) = innerEndpoint {
                    let hostStr: String
                    switch host {
                    case .ipv4(let addr): hostStr = "\(addr)"
                    case .ipv6(let addr): hostStr = "[\(addr)]"
                    default:              hostStr = "\(host)"
                    }
                    print("[Connection] Resolved to \(hostStr):\(port.rawValue)")
                    connection.cancel()
                    self?.resolveConnection = nil
                    DispatchQueue.main.async {
                        self?.connectWebSocket(host: hostStr, port: Int(port.rawValue))
                    }
                }
            case .failed(let error):
                print("[Connection] Resolve failed: \(error)")
                connection.cancel()
                self?.resolveConnection = nil
                DispatchQueue.main.async { self?.isConnecting = false }
            default:
                break
            }
        }

        connection.start(queue: .global())

        // Timeout fallback: try service name as .local hostname
        DispatchQueue.global().asyncAfter(deadline: .now() + 5) { [weak self] in
            guard !resolved else { return }
            resolved = true
            print("[Connection] NWConnection timed out, trying direct hostname...")
            connection.cancel()
            self?.resolveConnection = nil
            if case .service(let name, _, _, _) = device.endpoint {
                let hostname = name.replacingOccurrences(of: "iPad-Canvas-", with: "")
                print("[Connection] Trying hostname: \(hostname).local")
                DispatchQueue.main.async {
                    self?.connectWebSocket(host: "\(hostname).local", port: 8080)
                }
            }
        }
    }

    private func connectWebSocket(host: String, port: Int) {
        let urlString = "ws://\(host):\(port)"
        guard let url = URL(string: urlString) else {
            print("[Connection] Invalid URL: \(urlString)")
            isConnecting = false
            return
        }
        print("[Connection] Connecting WebSocket to \(urlString)...")
        webSocket = session.webSocketTask(with: url)
        webSocket?.resume()
        isConnected = true
        isConnecting = false
        receiveMessage()
        startHeartbeat()
    }

    func disconnect() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
        DispatchQueue.main.async {
            self.isConnected = false
            self.isConnecting = false
            self.hostName = ""
            self.currentPage = 0
            self.pageCount = 1
        }
    }

    // MARK: - Stroke Sending

    func beginStroke(id: String) {
        currentStrokeId = id
        pointBuffer.removeAll()
    }

    func addPoint(_ point: StrokePoint) {
        pointBuffer.append(point)
        if pointBuffer.count >= 4 { flushPoints() }
    }

    func endStroke() {
        flushPoints()
        if let id = currentStrokeId {
            sendCodable(SimpleMessage(type: "stroke_complete", strokeId: id))
        }
        currentStrokeId = nil
    }

    private func flushPoints() {
        guard let id = currentStrokeId, !pointBuffer.isEmpty else { return }
        let strokeData = StrokeData(
            id: id,
            points: pointBuffer,
            color: toolState?.currentColor ?? "#000000",
            width: toolState?.currentSize ?? 2.0,
            tool: toolState?.currentTool ?? "pen"
        )
        sendCodable(StrokeMessage(type: "stroke_update", stroke: strokeData))
        pointBuffer.removeAll()
    }

    // MARK: - Action Sending

    func sendUndo()    { sendCodable(ActionMessage(type: "undo")) }
    func sendRedo()    { sendCodable(ActionMessage(type: "redo")) }
    func sendPageAdd() { sendCodable(ActionMessage(type: "page_add")) }

    func sendPageSwitch(to index: Int) {
        sendCodable(ActionMessage(type: "page_switch", page: index))
    }

    func sendEraseAt(x: Double, y: Double) {
        sendCodable(ActionMessage(type: "erase_at", x: x, y: y))
    }

    // MARK: - Messaging

    private func sendCodable<T: Codable>(_ value: T) {
        guard let data = try? JSONEncoder().encode(value),
              let string = String(data: data, encoding: .utf8) else { return }
        webSocket?.send(.string(string)) { error in
            if let error = error { print("[Connection] Send error: \(error)") }
        }
    }

    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                if case .string(let text) = message { self?.handleMessage(text) }
                self?.receiveMessage()
            case .failure(let error):
                print("[Connection] Receive error: \(error)")
                DispatchQueue.main.async { self?.isConnected = false }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        // page_state — desktop tells iPad current page and total count
        if let ps = try? JSONDecoder().decode(PageStateMessage.self, from: data),
           ps.type == "page_state" {
            DispatchQueue.main.async {
                self.currentPage = ps.currentPage
                self.pageCount   = ps.pageCount
            }
            return
        }

        // welcome
        if let welcome = try? JSONDecoder().decode(WelcomeMessage.self, from: data) {
            DispatchQueue.main.async { self.hostName = welcome.deviceName }
            print("[Connection] Connected to: \(welcome.deviceName)")
            return
        }

        // pong (latency)
        if let pong = try? JSONDecoder().decode(SimpleMessage.self, from: data),
           pong.type == "pong", let ts = pong.timestamp {
            let latencyMs = (Date().timeIntervalSince1970 * 1000) - ts
            DispatchQueue.main.async { self.latency = latencyMs }
        }
    }

    // MARK: - Heartbeat

    private func startHeartbeat() {
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.sendCodable(SimpleMessage(
                type: "ping",
                timestamp: Date().timeIntervalSince1970 * 1000
            ))
        }
    }
}
