import UIKit

class DrawingCanvasView: UIView {

    var connectionService: ConnectionService?

    // Local drawing state - store individual segments with pressure
    private struct Segment {
        let from: CGPoint
        let to: CGPoint
        let width: CGFloat
    }
    private var completedSegments: [Segment] = []
    private var currentSegments: [Segment] = []
    private var lastPoint: CGPoint?
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

        lastPoint = location
        currentSegments = []

        // Send first point
        sendPoint(touch: touch)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, let prev = lastPoint else { return }

        // Use coalesced touches for smoother lines
        let coalescedTouches = event?.coalescedTouches(for: touch) ?? [touch]
        var from = prev

        for coalescedTouch in coalescedTouches {
            let location = coalescedTouch.location(in: self)
            let pressure = coalescedTouch.force > 0 ? coalescedTouch.force / coalescedTouch.maximumPossibleForce : 0.5
            let width = max(0.5, 3.0 * pressure)

            currentSegments.append(Segment(from: from, to: location, width: width))
            from = location
            sendPoint(touch: coalescedTouch)
        }

        lastPoint = from
        setNeedsDisplay()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        // Add final segment
        if let prev = lastPoint {
            let location = touch.location(in: self)
            let pressure = touch.force > 0 ? touch.force / touch.maximumPossibleForce : 0.5
            let width = max(0.5, 3.0 * pressure)
            currentSegments.append(Segment(from: prev, to: location, width: width))
        }

        sendPoint(touch: touch)
        connectionService?.endStroke()

        // Move current segments to completed
        completedSegments.append(contentsOf: currentSegments)
        currentSegments = []
        lastPoint = nil
        currentStrokeId = nil
        setNeedsDisplay()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        connectionService?.endStroke()
        completedSegments.append(contentsOf: currentSegments)
        currentSegments = []
        lastPoint = nil
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

        let allSegments = completedSegments + currentSegments
        for seg in allSegments {
            let path = UIBezierPath()
            path.lineCapStyle = .round
            path.move(to: seg.from)
            path.addLine(to: seg.to)
            path.lineWidth = seg.width
            path.stroke()
        }
    }

    func clear() {
        completedSegments.removeAll()
        currentSegments.removeAll()
        lastPoint = nil
        setNeedsDisplay()
    }
}
