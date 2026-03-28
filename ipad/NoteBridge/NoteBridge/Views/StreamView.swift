import SwiftUI
import UIKit

// StreamView displays the MJPEG stream from the Windows hidden iPad view window.
// It fills the screen and forwards all touch and Apple Pencil input to Windows
// as normalized touch_event messages.

struct StreamView: View {
    @ObservedObject var stream: StreamService

    var body: some View {
        ZStack {
            Color.white.ignoresSafeArea()

            if let frame = stream.currentFrame {
                Image(uiImage: frame)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
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

            // UIKit-based touch capture — SwiftUI gestures don't expose
            // Apple Pencil pressure, so we use a transparent UIView overlay.
            TouchInputView(stream: stream)
                .ignoresSafeArea()
        }
    }
}

// ── UIKit touch capture ───────────────────────────────────────────────────────

// Wraps a UIView that overrides touchesBegan/Moved/Ended to capture Apple
// Pencil force and send normalized touch_event messages to Windows.

struct TouchInputView: UIViewRepresentable {
    let stream: StreamService

    func makeUIView(context: Context) -> TouchCapture {
        let view = TouchCapture()
        view.stream = stream
        view.backgroundColor = .clear
        view.isMultipleTouchEnabled = false // one pointer at a time
        return view
    }

    func updateUIView(_ uiView: TouchCapture, context: Context) {
        uiView.stream = stream
    }
}

class TouchCapture: UIView {
    var stream: StreamService?

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let (nx, ny, pressure) = normalize(touch)
        stream?.sendTouchEvent(action: "down", x: nx, y: ny, pressure: pressure)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        // Use coalesced touches for smoother Apple Pencil input
        let allTouches = event?.coalescedTouches(for: touch) ?? [touch]
        for t in allTouches {
            let (nx, ny, pressure) = normalize(t)
            stream?.sendTouchEvent(action: "move", x: nx, y: ny, pressure: pressure)
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let (nx, ny, pressure) = normalize(touch)
        stream?.sendTouchEvent(action: "up", x: nx, y: ny, pressure: pressure)
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let (nx, ny, _) = normalize(touch)
        stream?.sendTouchEvent(action: "up", x: nx, y: ny, pressure: 0)
    }

    // Normalize touch to 0–1 coordinates and extract pressure.
    // Apple Pencil: force / maximumPossibleForce gives 0–1.
    // Finger touch: force is 0, default pressure 0.5.
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
