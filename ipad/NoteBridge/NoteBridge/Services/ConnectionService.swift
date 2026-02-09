import Foundation
import Network
import Combine

class ConnectionService: ObservableObject {
    @Published var isConnected = false
    @Published var isConnecting = false
    @Published var hostName = ""
    @Published var latency: Double = 0

    private var webSocket: URLSessionWebSocketTask?
    private let session = URLSession(configuration: .default)
    private var heartbeatTimer: Timer?
    private var pointBuffer: [StrokePoint] = []
    private var currentStrokeId: String?

    // Connect to a discovered device by resolving its Bonjour endpoint
    func connect(to device: Device) {
        DispatchQueue.main.async {
            self.isConnecting = true
        }
        print("[Connection] Resolving endpoint for: \(device.name)")

        // Resolve the Bonjour service to get IP and port
        let connection = NWConnection(to: device.endpoint, using: .tcp)

        connection.stateUpdateHandler = { [weak self] state in
            print("[Connection] NWConnection state: \(state)")
            switch state {
            case .ready:
                if let innerEndpoint = connection.currentPath?.remoteEndpoint,
                   case .hostPort(let host, let port) = innerEndpoint {
                    let hostStr: String
                    switch host {
                    case .ipv4(let addr):
                        hostStr = "\(addr)"
                    case .ipv6(let addr):
                        // Wrap IPv6 in brackets for URL
                        hostStr = "[\(addr)]"
                    default:
                        hostStr = "\(host)"
                    }
                    let portNum = port.rawValue
                    print("[Connection] Resolved to \(hostStr):\(portNum)")
                    connection.cancel()
                    DispatchQueue.main.async {
                        self?.connectWebSocket(host: hostStr, port: Int(portNum))
                    }
                }
            case .failed(let error):
                print("[Connection] Resolve failed: \(error)")
                connection.cancel()
                DispatchQueue.main.async {
                    self?.isConnecting = false
                }
            default:
                break
            }
        }

        connection.start(queue: .global())
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
        }
    }

    // MARK: - Stroke Sending

    func beginStroke(id: String) {
        currentStrokeId = id
        pointBuffer.removeAll()
    }

    func addPoint(_ point: StrokePoint) {
        pointBuffer.append(point)

        // Send in batches of 3-5 points for efficiency
        if pointBuffer.count >= 4 {
            flushPoints()
        }
    }

    func endStroke() {
        // Send remaining points
        flushPoints()

        // Send stroke_complete
        if let id = currentStrokeId {
            let msg = SimpleMessage(type: "stroke_complete", strokeId: id)
            sendCodable(msg)
        }

        currentStrokeId = nil
    }

    private func flushPoints() {
        guard let id = currentStrokeId, !pointBuffer.isEmpty else { return }

        let strokeData = StrokeData(
            id: id,
            points: pointBuffer,
            color: "#000000",
            width: 2.0,
            tool: "pen"
        )

        let message = StrokeMessage(type: "stroke_update", stroke: strokeData)
        sendCodable(message)
        pointBuffer.removeAll()
    }

    // MARK: - Messaging

    private func sendCodable<T: Codable>(_ value: T) {
        guard let data = try? JSONEncoder().encode(value),
              let string = String(data: data, encoding: .utf8) else { return }

        webSocket?.send(.string(string)) { error in
            if let error = error {
                print("[Connection] Send error: \(error)")
            }
        }
    }

    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                default:
                    break
                }
                // Keep listening
                self?.receiveMessage()

            case .failure(let error):
                print("[Connection] Receive error: \(error)")
                DispatchQueue.main.async {
                    self?.isConnected = false
                }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        // Try parsing as welcome message
        if let welcome = try? JSONDecoder().decode(WelcomeMessage.self, from: data) {
            DispatchQueue.main.async {
                self.hostName = welcome.deviceName
            }
            print("[Connection] Connected to: \(welcome.deviceName)")
            return
        }

        // Try parsing as pong (latency response)
        if let pong = try? JSONDecoder().decode(SimpleMessage.self, from: data),
           pong.type == "pong",
           let timestamp = pong.timestamp {
            let latencyMs = (Date().timeIntervalSince1970 * 1000) - timestamp
            DispatchQueue.main.async {
                self.latency = latencyMs
            }
        }
    }

    // MARK: - Heartbeat

    private func startHeartbeat() {
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            let ping = SimpleMessage(
                type: "ping",
                timestamp: Date().timeIntervalSince1970 * 1000
            )
            self?.sendCodable(ping)
        }
    }
}
