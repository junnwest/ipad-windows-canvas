import SwiftUI
import UIKit

// StreamView displays the MJPEG stream from the Windows hidden iPad view window.
// It fills the screen and forwards all touch and Apple Pencil input to Windows
// as normalized touch_event messages.
//
// A PreviewCanvas overlay draws the current stroke immediately in screen space
// so the user sees zero-latency feedback while the server round-trip is in flight.
// The overlay is cleared once two server frames have arrived after the stroke ends,
// by which point the committed stroke is visible in the server frame.

struct StreamView: View {
    @ObservedObject var stream: StreamService
    // Reference type — persists across SwiftUI rebuilds via @State
    @State private var preview = PreviewCanvas(frame: .zero)

    var body: some View {
        ZStack {
            Color.white.ignoresSafeArea()

            if let frame = stream.currentFrame {
                Image(uiImage: frame)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .ignoresSafeArea()
            } else {
                // Waiting for first frame
                VStack(spacing: 12) {
                    ProgressView()
                    Text("Connecting to \(stream.hostName)…")
                        .font(.callout)
                        .foregroundColor(.secondary)
                }
            }

            PreviewOverlayView(canvas: preview).ignoresSafeArea()

            TouchInputView(stream: stream, preview: preview)
                .ignoresSafeArea()
        }
        .onChange(of: stream.currentFrame) { _ in
            // Wait for two frames after stroke ends so the server frame
            // has time to include the committed stroke before we clear.
            if !preview.strokeActive {
                preview.framesAfterEnd += 1
                if preview.framesAfterEnd >= 2 {
                    preview.clear()
                }
            }
        }
    }
}

// ── Local stroke preview ──────────────────────────────────────────────────────

class PreviewCanvas: UIView {
    private struct Seg { let from, to: CGPoint; let w: CGFloat; let c: UIColor }
    private var segs: [Seg] = []
    private var lastPt: CGPoint?

    var strokeActive = false
    var framesAfterEnd = 0

    override init(frame: CGRect) {
        super.init(frame: frame)
        isOpaque = false
        backgroundColor = .clear
    }
    required init?(coder: NSCoder) { fatalError() }

    func beginStroke(at pt: CGPoint) {
        strokeActive = true
        framesAfterEnd = 0
        lastPt = pt
    }

    func addPoint(_ pt: CGPoint, width: CGFloat, color: UIColor) {
        guard let prev = lastPt else { lastPt = pt; return }
        segs.append(Seg(from: prev, to: pt, w: width, c: color))
        lastPt = pt
        setNeedsDisplay()
    }

    func endStroke() {
        strokeActive = false
        lastPt = nil
    }

    func clear() {
        segs = []
        lastPt = nil
        framesAfterEnd = 0
        setNeedsDisplay()
    }

    override func draw(_ rect: CGRect) {
        for i in segs.indices {
            let seg = segs[i]
            let path = UIBezierPath()
            path.lineCapStyle  = .round
            path.lineJoinStyle = .round
            path.lineWidth     = seg.w
            if i >= 1, segs[i - 1].to == seg.from {
                let pPrev = segs[i - 1].from
                let mid0  = CGPoint(x: (pPrev.x + seg.from.x) / 2, y: (pPrev.y + seg.from.y) / 2)
                let mid1  = CGPoint(x: (seg.from.x + seg.to.x) / 2, y: (seg.from.y + seg.to.y) / 2)
                path.move(to: mid0)
                path.addQuadCurve(to: mid1, controlPoint: seg.from)
            } else {
                path.move(to: seg.from)
                path.addLine(to: seg.to)
            }
            seg.c.setStroke()
            path.stroke()
        }
    }
}

struct PreviewOverlayView: UIViewRepresentable {
    let canvas: PreviewCanvas
    func makeUIView(context: Context) -> PreviewCanvas { canvas }
    func updateUIView(_ uiView: PreviewCanvas, context: Context) {}
}

// ── UIKit touch capture ───────────────────────────────────────────────────────

struct TouchInputView: UIViewRepresentable {
    let stream: StreamService
    let preview: PreviewCanvas

    func makeUIView(context: Context) -> TouchCapture {
        let view = TouchCapture()
        view.stream  = stream
        view.preview = preview
        view.backgroundColor = .clear
        view.isMultipleTouchEnabled = false
        return view
    }

    func updateUIView(_ uiView: TouchCapture, context: Context) {
        uiView.stream  = stream
        uiView.preview = preview
    }
}

class TouchCapture: UIView {
    var stream:  StreamService?
    var preview: PreviewCanvas?

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let (nx, ny, pressure) = normalize(touch)
        stream?.sendTouchEvent(action: "down", x: nx, y: ny, pressure: pressure)
        if stream?.currentTool == "pen" {
            preview?.beginStroke(at: touch.location(in: self))
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let allTouches = event?.coalescedTouches(for: touch) ?? [touch]
        let isPen = stream?.currentTool == "pen"
        for t in allTouches {
            let (nx, ny, pressure) = normalize(t)
            stream?.sendTouchEvent(action: "move", x: nx, y: ny, pressure: pressure)
            if isPen {
                let loc   = t.location(in: self)
                let baseW = CGFloat(stream?.currentSize ?? 2.0)
                let w     = max(0.5, baseW * pressure)
                let c     = UIColor(hex: stream?.currentColor ?? "#1a1a1a")
                preview?.addPoint(loc, width: w, color: c)
            }
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let (nx, ny, pressure) = normalize(touch)
        stream?.sendTouchEvent(action: "up", x: nx, y: ny, pressure: pressure)
        preview?.endStroke()
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let (nx, ny, _) = normalize(touch)
        stream?.sendTouchEvent(action: "up", x: nx, y: ny, pressure: 0)
        preview?.endStroke()
    }

    private func normalize(_ touch: UITouch) -> (CGFloat, CGFloat, CGFloat) {
        let pt   = touch.location(in: self)
        let nx   = pt.x / bounds.width
        let ny   = pt.y / bounds.height
        let maxF = touch.maximumPossibleForce
        let pressure: CGFloat = maxF > 0 ? touch.force / maxF : 0.5
        return (
            max(0, min(1, nx)),
            max(0, min(1, ny)),
            max(0.1, min(1, pressure))
        )
    }
}
