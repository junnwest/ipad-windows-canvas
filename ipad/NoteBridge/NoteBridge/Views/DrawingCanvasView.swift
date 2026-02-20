import UIKit

class DrawingCanvasView: UIView {

    var connectionService: ConnectionService?
    var toolState: ToolState?

    // Local preview strokes (iPad-side only; desktop holds the authoritative state)
    private struct Segment {
        let from: CGPoint
        let to: CGPoint
        let width: CGFloat
        let color: UIColor
    }
    private var completedSegments: [Segment] = []
    private var currentSegments:   [Segment] = []
    private var lastPoint: CGPoint?
    private var currentStrokeId: String?

    // Eraser: just track cursor position for visual feedback
    private var eraserPoint: CGPoint?
    private let eraserRadius: CGFloat = 20

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

        if toolState?.currentTool == "eraser" {
            eraserPoint = location
            setNeedsDisplay()
            sendEraseAt(location)
        } else {
            let id = UUID().uuidString
            currentStrokeId = id
            connectionService?.beginStroke(id: id)
            lastPoint = location
            currentSegments = []
            sendStrokePoint(touch)
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        if toolState?.currentTool == "eraser" {
            let coalescedTouches = event?.coalescedTouches(for: touch) ?? [touch]
            for ct in coalescedTouches { sendEraseAt(ct.location(in: self)) }
            eraserPoint = touch.location(in: self)
            setNeedsDisplay()
        } else {
            guard let prev = lastPoint else { return }
            let coalescedTouches = event?.coalescedTouches(for: touch) ?? [touch]
            let strokeColor = UIColor(hex: toolState?.currentColor ?? "#000000")
            let baseWidth   = CGFloat(toolState?.currentSize ?? 2.0)
            var from = prev
            for ct in coalescedTouches {
                let loc      = ct.location(in: self)
                let pressure = ct.force > 0 ? ct.force / ct.maximumPossibleForce : 0.5
                let width    = max(0.5, baseWidth * pressure)
                currentSegments.append(Segment(from: from, to: loc, width: width, color: strokeColor))
                from = loc
                sendStrokePoint(ct)
            }
            lastPoint = from
            setNeedsDisplay()
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        if toolState?.currentTool == "eraser" {
            eraserPoint = nil
            setNeedsDisplay()
        } else {
            if let prev = lastPoint {
                let loc      = touch.location(in: self)
                let pressure = touch.force > 0 ? touch.force / touch.maximumPossibleForce : 0.5
                let strokeColor = UIColor(hex: toolState?.currentColor ?? "#000000")
                let baseWidth   = CGFloat(toolState?.currentSize ?? 2.0)
                currentSegments.append(Segment(from: prev, to: loc, width: max(0.5, baseWidth * pressure), color: strokeColor))
            }
            sendStrokePoint(touch)
            connectionService?.endStroke()
            completedSegments.append(contentsOf: currentSegments)
            currentSegments = []
            lastPoint = nil
            currentStrokeId = nil
            setNeedsDisplay()
        }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        if toolState?.currentTool == "eraser" {
            eraserPoint = nil
        } else {
            connectionService?.endStroke()
            completedSegments.append(contentsOf: currentSegments)
            currentSegments = []
            lastPoint = nil
            currentStrokeId = nil
        }
        setNeedsDisplay()
    }

    // MARK: - Send helpers

    private func sendStrokePoint(_ touch: UITouch) {
        let loc      = touch.location(in: self)
        let pressure = touch.force > 0 ? touch.force / touch.maximumPossibleForce : 0.5
        connectionService?.addPoint(StrokePoint(
            x:         Double(loc.x / bounds.width),
            y:         Double(loc.y / bounds.height),
            pressure:  Double(max(0.1, pressure)),
            timestamp: Date().timeIntervalSince1970 * 1000
        ))
    }

    private func sendEraseAt(_ location: CGPoint) {
        connectionService?.sendEraseAt(
            x: Double(location.x / bounds.width),
            y: Double(location.y / bounds.height)
        )
    }

    // MARK: - Drawing

    override func draw(_ rect: CGRect) {
        for seg in completedSegments + currentSegments {
            seg.color.setStroke()
            let path = UIBezierPath()
            path.lineCapStyle  = .round
            path.lineJoinStyle = .round
            path.move(to: seg.from)
            path.addLine(to: seg.to)
            path.lineWidth = seg.width
            path.stroke()
        }

        // Eraser cursor: translucent red ring
        if let ep = eraserPoint {
            let r    = eraserRadius
            let ring = UIBezierPath(ovalIn: CGRect(x: ep.x - r, y: ep.y - r, width: r * 2, height: r * 2))
            UIColor.systemRed.withAlphaComponent(0.55).setStroke()
            ring.lineWidth = 1.5
            ring.stroke()
        }
    }

    // MARK: - Page switch: clear local preview

    func clearForPageSwitch() {
        completedSegments.removeAll()
        currentSegments.removeAll()
        lastPoint = nil
        eraserPoint = nil
        setNeedsDisplay()
    }

    func clear() {
        completedSegments.removeAll()
        currentSegments.removeAll()
        lastPoint = nil
        setNeedsDisplay()
    }
}

// MARK: - UIColor from hex

extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        self.init(
            red:   CGFloat((int >> 16) & 0xFF) / 255,
            green: CGFloat((int >> 8)  & 0xFF) / 255,
            blue:  CGFloat( int        & 0xFF) / 255,
            alpha: 1
        )
    }
}
