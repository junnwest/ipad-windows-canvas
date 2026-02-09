import UIKit

class DrawingCanvasView: UIView {

    var connectionService: ConnectionService?

    // Local drawing state
    private var currentPath: UIBezierPath?
    private var allPaths: [(path: UIBezierPath, width: CGFloat)] = []
    private var currentStrokeId: String?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .white
        isMultipleTouchEnabled = false
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .white
        isMultipleTouchEnabled = false
    }

    // MARK: - Touch Handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let location = touch.location(in: self)

        // Start a new stroke
        let strokeId = UUID().uuidString
        currentStrokeId = strokeId
        connectionService?.beginStroke(id: strokeId)

        // Start local path
        let path = UIBezierPath()
        path.lineCapStyle = .round
        path.lineJoinStyle = .round
        path.move(to: location)
        currentPath = path

        // Send first point
        sendPoint(touch: touch)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, let path = currentPath else { return }

        // Use coalesced touches for smoother lines
        let coalescedTouches = event?.coalescedTouches(for: touch) ?? [touch]

        for coalescedTouch in coalescedTouches {
            let location = coalescedTouch.location(in: self)
            path.addLine(to: location)
            sendPoint(touch: coalescedTouch)
        }

        // Redraw only the affected area (optimization)
        setNeedsDisplay()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        // Add final point
        sendPoint(touch: touch)

        // Finalize the path
        if let path = currentPath {
            let pressure = touch.force > 0 ? touch.force / touch.maximumPossibleForce : 0.5
            let width = 2.0 * pressure
            allPaths.append((path: path, width: width))
        }

        connectionService?.endStroke()
        currentPath = nil
        currentStrokeId = nil
        setNeedsDisplay()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let path = currentPath {
            allPaths.append((path: path, width: 1.0))
        }
        connectionService?.endStroke()
        currentPath = nil
        currentStrokeId = nil
        setNeedsDisplay()
    }

    // MARK: - Send to Windows

    private func sendPoint(touch: UITouch) {
        let location = touch.location(in: self)

        // Normalize to 0-1 range for transmission
        let x = Double(location.x / bounds.width)
        let y = Double(location.y / bounds.height)

        // Get pressure (Apple Pencil provides this; finger defaults to ~0.5)
        let rawPressure = touch.force > 0 ? touch.force / touch.maximumPossibleForce : 0.5
        let pressure = Double(max(0.1, rawPressure))

        let point = StrokePoint(
            x: x,
            y: y,
            pressure: pressure,
            timestamp: Date().timeIntervalSince1970 * 1000
        )

        connectionService?.addPoint(point)
    }

    // MARK: - Drawing

    override func draw(_ rect: CGRect) {
        UIColor.black.setStroke()

        // Draw completed strokes
        for entry in allPaths {
            entry.path.lineWidth = entry.width
            entry.path.stroke()
        }

        // Draw current in-progress stroke
        if let path = currentPath {
            path.lineWidth = 2.0
            path.stroke()
        }
    }

    func clear() {
        allPaths.removeAll()
        currentPath = nil
        setNeedsDisplay()
    }
}
