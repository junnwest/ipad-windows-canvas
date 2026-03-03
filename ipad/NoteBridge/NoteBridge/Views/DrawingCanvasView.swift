import UIKit

class DrawingCanvasView: UIView {

    var connectionService: ConnectionService?
    var toolState: ToolState?

    // Page layout — updated via loadPageState()
    private var pageAspectRatio: CGFloat = 297.0 / 210.0  // default: A4 landscape
    private var currentTemplate: String  = "blank"

    // Authoritative strokes, text and image elements from desktop (full page state)
    private var receivedStrokes: [StrokeData]   = []
    private var receivedTexts:   [TextElement]  = []
    private var receivedImages:  [ImageElement] = []
    private var imageCache:      [String: UIImage] = [:]

    // Local preview: strokes drawn on iPad, kept visible until desktop confirms them
    private var localPreviewStrokes: [Segment] = []

    // The stroke actively being drawn right now
    private var currentSegments: [Segment] = []

    private var lastPoint: CGPoint?
    private var eraserPoint: CGPoint?
    private let eraserRadius: CGFloat = 20

    // Bitmap cache of receivedStrokes — rebuilt only when loadPageState fires or bounds change
    private var receivedStrokesCache: UIImage?
    private var cachedPageRect: CGRect = .zero

    // View-level zoom/pan (purely visual — normalised stroke coords are unaffected)
    private var viewZoom: CGFloat = 1.0
    private var viewPanOffset: CGPoint = .zero
    private var pinchStartZoom: CGFloat = 1.0
    private var pinchStartPan: CGPoint = .zero

    // Page-size aspect-ratio table (widthMm / heightMm)
    private static let pageSizeRatios: [String: CGFloat] = [
        "a4-landscape":     297.0 / 210.0,
        "a4-portrait":      210.0 / 297.0,
        "letter-landscape": 279.4 / 215.9,
        "letter-portrait":  215.9 / 279.4,
        "square":           1.0,
    ]

    private struct Segment {
        let from: CGPoint
        let to: CGPoint
        let width: CGFloat
        let color: UIColor
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }
    private func setup() {
        backgroundColor = UIColor(white: 0.69, alpha: 1)  // gray canvas surround
        isMultipleTouchEnabled = true  // needed for pinch/pan gestures

        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
        pinch.delegate = self
        addGestureRecognizer(pinch)

        let twoFingerPan = UIPanGestureRecognizer(target: self, action: #selector(handleTwoFingerPan(_:)))
        twoFingerPan.minimumNumberOfTouches = 2
        twoFingerPan.delegate = self
        addGestureRecognizer(twoFingerPan)

        let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap(_:)))
        doubleTap.numberOfTapsRequired = 2
        doubleTap.numberOfTouchesRequired = 2
        addGestureRecognizer(doubleTap)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // Bounds changed (e.g. rotation) — rebuild cache so strokes map to the new page rect
        if pageRect != cachedPageRect, !receivedStrokes.isEmpty {
            rebuildStrokesCache()
        }
    }

    // MARK: - Page rect (matches desktop page aspect ratio)

    private var pageRect: CGRect {
        let padding: CGFloat = 20
        let avail = bounds.insetBy(dx: padding, dy: padding)
        guard avail.width > 0, avail.height > 0 else { return bounds }
        let availRatio = avail.width / avail.height
        if availRatio > pageAspectRatio {
            let w = avail.height * pageAspectRatio
            return CGRect(x: avail.minX + (avail.width - w) / 2,
                          y: avail.minY, width: w, height: avail.height)
        } else {
            let h = avail.width / pageAspectRatio
            return CGRect(x: avail.minX,
                          y: avail.minY + (avail.height - h) / 2,
                          width: avail.width, height: h)
        }
    }

    // pageRect scaled/offset by current view zoom and pan
    private var visiblePageRect: CGRect {
        let pr = pageRect
        let w = pr.width  * viewZoom
        let h = pr.height * viewZoom
        return CGRect(x: pr.midX + viewPanOffset.x - w / 2,
                      y: pr.midY + viewPanOffset.y - h / 2,
                      width: w, height: h)
    }

    // Normalize a screen point to [0,1] relative to the visible (zoomed) page rect
    private func normalize(_ pt: CGPoint) -> CGPoint {
        let vpr = visiblePageRect
        guard vpr.width > 0, vpr.height > 0 else { return .zero }
        return CGPoint(
            x: max(0, min(1, Double((pt.x - vpr.minX) / vpr.width))),
            y: max(0, min(1, Double((pt.y - vpr.minY) / vpr.height)))
        )
    }

    // Map a normalized [0,1] point back to screen coordinates
    private func denormalize(_ pt: CGPoint) -> CGPoint {
        let pr = pageRect
        return CGPoint(x: pr.minX + pt.x * pr.width,
                       y: pr.minY + pt.y * pr.height)
    }

    // MARK: - Page state from desktop

    func loadPageState(_ ps: PageStateMessage) {
        pageAspectRatio = Self.pageSizeRatios[ps.pageSize ?? ""] ?? (297.0 / 210.0)
        currentTemplate = ps.template ?? "blank"
        receivedStrokes = ps.strokes ?? []
        receivedTexts   = ps.texts   ?? []
        // Decode and cache new images; keep existing cached entries to avoid redundant work
        let newImages = ps.images ?? []
        let newIds = Set(newImages.map(\.id))
        imageCache = imageCache.filter { newIds.contains($0.key) }
        for img in newImages where imageCache[img.id] == nil {
            let base64 = img.src.components(separatedBy: ",").last ?? img.src
            if let data = Data(base64Encoded: base64), let ui = UIImage(data: data) {
                imageCache[img.id] = ui
            }
        }
        receivedImages = newImages
        localPreviewStrokes = []   // authoritative state has arrived — discard local preview
        currentSegments = []
        rebuildStrokesCache()
    }

    // Renders the page at 2× resolution without zoom/pan — suitable for sharing.
    func exportPageImage() -> UIImage? {
        let pr = pageRect
        guard pr.width > 0, pr.height > 0 else { return nil }

        // Temporarily reset zoom/pan so the full page is captured, not a zoomed-in region
        let savedZoom = viewZoom
        let savedPan  = viewPanOffset
        viewZoom      = 1.0
        viewPanOffset = .zero

        let format = UIGraphicsImageRendererFormat()
        format.scale = 2.0   // 2× for print-quality output
        let renderer = UIGraphicsImageRenderer(size: pr.size, format: format)

        let image = renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: pr.size))
            // Shift so pageRect.origin → (0, 0) in the export context
            ctx.cgContext.translateBy(x: -pr.minX, y: -pr.minY)
            drawTemplate(ctx.cgContext, in: pr)
            drawReceivedImages(in: pr)
            if let cache = receivedStrokesCache { cache.draw(in: pr) }
            drawReceivedTexts(in: pr)
        }

        viewZoom      = savedZoom
        viewPanOffset = savedPan
        return image
    }

    func clearForPageSwitch() {
        receivedStrokes = []
        receivedTexts   = []
        receivedImages  = []
        imageCache.removeAll()
        localPreviewStrokes = []
        currentSegments = []
        eraserPoint = nil
        receivedStrokesCache = nil
        cachedPageRect = .zero
        setNeedsDisplay()
    }

    func clear() {
        localPreviewStrokes = []
        currentSegments = []
        setNeedsDisplay()
    }

    // MARK: - Stroke cache

    private func rebuildStrokesCache() {
        let pr = pageRect
        cachedPageRect = pr
        guard pr.width > 0, pr.height > 0, !receivedStrokes.isEmpty else {
            receivedStrokesCache = nil
            setNeedsDisplay()
            return
        }
        let imageRenderer = UIGraphicsImageRenderer(size: pr.size)
        receivedStrokesCache = imageRenderer.image { ctx in
            // Translate so denormalized view-space coords land correctly inside the image
            ctx.cgContext.translateBy(x: -pr.minX, y: -pr.minY)
            for stroke in receivedStrokes {
                drawReceivedStroke(stroke, ctx: ctx.cgContext)
            }
        }
        setNeedsDisplay()
    }

    // MARK: - Zoom / pan gestures

    @objc private func handlePinch(_ gr: UIPinchGestureRecognizer) {
        switch gr.state {
        case .began:
            pinchStartZoom = viewZoom
            pinchStartPan  = viewPanOffset
        case .changed:
            let Z1 = pinchStartZoom
            let Z2 = max(1.0, min(6.0, pinchStartZoom * gr.scale))
            // Adjust pan so the pinch centre stays fixed on screen
            let p  = gr.location(in: self)
            let pr = pageRect
            let cx = pr.midX + pinchStartPan.x
            let cy = pr.midY + pinchStartPan.y
            viewZoom = Z2
            viewPanOffset = CGPoint(
                x: pinchStartPan.x + (p.x - cx) * (1 - Z2 / Z1),
                y: pinchStartPan.y + (p.y - cy) * (1 - Z2 / Z1)
            )
            if viewZoom == 1.0 { viewPanOffset = .zero }
            setNeedsDisplay()
        default:
            break
        }
    }

    @objc private func handleTwoFingerPan(_ gr: UIPanGestureRecognizer) {
        guard viewZoom > 1.0, gr.state == .changed else { return }
        let delta = gr.translation(in: self)
        gr.setTranslation(.zero, in: self)
        viewPanOffset = CGPoint(x: viewPanOffset.x + delta.x,
                                y: viewPanOffset.y + delta.y)
        setNeedsDisplay()
    }

    @objc private func handleDoubleTap(_ gr: UITapGestureRecognizer) {
        guard gr.state == .ended else { return }
        viewZoom      = 1.0
        viewPanOffset = .zero
        setNeedsDisplay()
    }

    // MARK: - Touch handling

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }
        let loc = touch.location(in: self)

        if toolState?.currentTool == "eraser" {
            eraserPoint = loc
            setNeedsDisplay()
            connectionService?.sendEraseAt(x: Double(normalize(loc).x),
                                           y: Double(normalize(loc).y))
        } else {
            let id = UUID().uuidString
            connectionService?.beginStroke(id: id)
            lastPoint = loc
            currentSegments = []
            sendStrokePoint(touch)
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first else { return }

        if toolState?.currentTool == "eraser" {
            let coalesced = event?.coalescedTouches(for: touch) ?? [touch]
            for ct in coalesced {
                let loc = ct.location(in: self)
                let n = normalize(loc)
                connectionService?.sendEraseAt(x: Double(n.x), y: Double(n.y))
            }
            eraserPoint = touch.location(in: self)
            setNeedsDisplay()
        } else {
            guard let prev = lastPoint else { return }
            let coalesced = event?.coalescedTouches(for: touch) ?? [touch]
            let strokeColor = UIColor(hex: toolState?.currentColor ?? "#000000")
            let baseWidth   = CGFloat(toolState?.currentSize ?? 2.0)
            var from = prev
            for ct in coalesced {
                let loc      = ct.location(in: self)
                let pressure = ct.force > 0 ? ct.force / ct.maximumPossibleForce : 0.5
                currentSegments.append(Segment(from: from, to: loc,
                                               width: max(0.5, baseWidth * pressure),
                                               color: strokeColor))
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
                let color    = UIColor(hex: toolState?.currentColor ?? "#000000")
                let width    = CGFloat(toolState?.currentSize ?? 2.0)
                currentSegments.append(Segment(from: prev, to: loc,
                                               width: max(0.5, width * pressure),
                                               color: color))
            }
            sendStrokePoint(touch)
            connectionService?.endStroke()
            localPreviewStrokes.append(contentsOf: currentSegments)
            currentSegments = []
            lastPoint = nil
            setNeedsDisplay()
        }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Discard in-progress stroke — cancel is usually triggered by a gesture recogniser
        // taking over (pinch/pan), so we don't want a partial stroke committed.
        eraserPoint = nil
        connectionService?.endStroke()
        currentSegments = []
        lastPoint = nil
        setNeedsDisplay()
    }

    // MARK: - Send helpers

    private func sendStrokePoint(_ touch: UITouch) {
        let n        = normalize(touch.location(in: self))
        let pressure = touch.force > 0 ? touch.force / touch.maximumPossibleForce : 0.5
        connectionService?.addPoint(StrokePoint(
            x: Double(n.x), y: Double(n.y),
            pressure: Double(max(0.1, pressure)),
            timestamp: Date().timeIntervalSince1970 * 1000
        ))
    }

    // MARK: - Drawing

    override func draw(_ rect: CGRect) {
        guard let ctx = UIGraphicsGetCurrentContext() else { return }
        let vpr = visiblePageRect   // page rect adjusted for current zoom/pan

        // White page area
        ctx.setFillColor(UIColor.white.cgColor)
        ctx.fill(vpr)

        // Template + cached received strokes (clipped to page)
        ctx.saveGState()
        ctx.clip(to: vpr)
        drawTemplate(ctx, in: vpr)
        drawReceivedImages(in: vpr)
        if let cache = receivedStrokesCache {
            cache.draw(in: vpr)   // UIKit scales the bitmap to fill vpr
        }
        drawReceivedTexts(in: vpr)
        ctx.restoreGState()

        // Local preview strokes (screen-space coords, drawn on top without clipping)
        // Uses midpoint quadratic smoothing; consecutive segments share exact from/to values.
        let allSegs = localPreviewStrokes + currentSegments
        for i in allSegs.indices {
            let seg = allSegs[i]
            seg.color.setStroke()
            let path = UIBezierPath()
            path.lineCapStyle  = .round
            path.lineJoinStyle = .round
            path.lineWidth = seg.width

            if i >= 1, allSegs[i - 1].to == seg.from {
                let pPrev = allSegs[i - 1].from
                let mid0  = CGPoint(x: (pPrev.x + seg.from.x) / 2, y: (pPrev.y + seg.from.y) / 2)
                let mid1  = CGPoint(x: (seg.from.x + seg.to.x) / 2, y: (seg.from.y + seg.to.y) / 2)
                path.move(to: mid0)
                path.addQuadCurve(to: mid1, controlPoint: seg.from)
            } else {
                path.move(to: seg.from)
                path.addLine(to: seg.to)
            }
            path.stroke()
        }

        // Page border
        ctx.setStrokeColor(UIColor(white: 0.75, alpha: 1).cgColor)
        ctx.setLineWidth(0.5)
        ctx.stroke(vpr)

        // Eraser cursor (screen-space, no zoom transform needed)
        if let ep = eraserPoint {
            let r    = eraserRadius
            let ring = UIBezierPath(ovalIn: CGRect(x: ep.x-r, y: ep.y-r, width: r*2, height: r*2))
            UIColor.systemRed.withAlphaComponent(0.55).setStroke()
            ring.lineWidth = 1.5
            ring.stroke()
        }
    }

    private func drawReceivedImages(in vpr: CGRect) {
        for img in receivedImages {
            guard let uiImg = imageCache[img.id] else { continue }
            let rect = CGRect(
                x:      vpr.minX + CGFloat(img.x)      * vpr.width,
                y:      vpr.minY + CGFloat(img.y)      * vpr.height,
                width:  CGFloat(img.width)  * vpr.width,
                height: CGFloat(img.height) * vpr.height
            )
            uiImg.draw(in: rect)
        }
    }

    private func drawReceivedTexts(in vpr: CGRect) {
        for text in receivedTexts {
            guard !text.content.isEmpty else { continue }
            let fontSize = CGFloat(text.fontSize) * vpr.height
            let font     = UIFont.systemFont(ofSize: max(1, fontSize))
            let attrs: [NSAttributedString.Key: Any] = [
                .font:            font,
                .foregroundColor: UIColor(hex: text.color),
            ]
            let pt = CGPoint(x: vpr.minX + CGFloat(text.x) * vpr.width,
                             y: vpr.minY + CGFloat(text.y) * vpr.height)
            (text.content as NSString).draw(at: pt, withAttributes: attrs)
        }
    }

    private func drawReceivedStroke(_ stroke: StrokeData, ctx: CGContext) {
        let pts = stroke.points
        guard pts.count >= 2 else { return }
        UIColor(hex: stroke.color).setStroke()
        for i in 1..<pts.count {
            let p0       = denormalize(CGPoint(x: pts[i-1].x, y: pts[i-1].y))
            let p1       = denormalize(CGPoint(x: pts[i].x,   y: pts[i].y))
            let pressure = CGFloat((pts[i-1].pressure + pts[i].pressure) / 2)
            let path     = UIBezierPath()
            path.lineCapStyle  = .round
            path.lineJoinStyle = .round
            path.lineWidth = max(0.5, CGFloat(stroke.width) * pressure)

            if i >= 2 {
                let pPrev = denormalize(CGPoint(x: pts[i-2].x, y: pts[i-2].y))
                let mid0  = CGPoint(x: (pPrev.x + p0.x) / 2, y: (pPrev.y + p0.y) / 2)
                let mid1  = CGPoint(x: (p0.x + p1.x) / 2,    y: (p0.y + p1.y) / 2)
                path.move(to: mid0)
                path.addQuadCurve(to: mid1, controlPoint: p0)
            } else {
                path.move(to: p0)
                path.addLine(to: p1)
            }
            path.stroke()
        }
    }

    // MARK: - Templates

    private func drawTemplate(_ ctx: CGContext, in r: CGRect) {
        switch currentTemplate {
        case "dotted":       drawDotted(ctx, r)
        case "squared":      drawSquared(ctx, r)
        case "ruled-narrow": drawRuled(ctx, r)
        case "cornell":      drawCornell(ctx, r)
        case "three-column": drawThreeColumn(ctx, r)
        default: break  // blank
        }
    }

    private func drawDotted(_ ctx: CGContext, _ r: CGRect) {
        let gap    = r.width / 26
        let margin = r.width / 28
        ctx.setFillColor(UIColor(white: 0.72, alpha: 1).cgColor)
        var y = r.minY + margin
        while y <= r.maxY - margin {
            var x = r.minX + margin
            while x <= r.maxX - margin {
                ctx.fillEllipse(in: CGRect(x: x-1.2, y: y-1.2, width: 2.4, height: 2.4))
                x += gap
            }
            y += gap
        }
    }

    private func drawSquared(_ ctx: CGContext, _ r: CGRect) {
        let gap = r.width / 26
        ctx.setStrokeColor(UIColor(white: 0.82, alpha: 1).cgColor)
        ctx.setLineWidth(0.5)
        var x = r.minX
        while x <= r.maxX { ctx.move(to: CGPoint(x: x, y: r.minY)); ctx.addLine(to: CGPoint(x: x, y: r.maxY)); x += gap }
        var y = r.minY
        while y <= r.maxY { ctx.move(to: CGPoint(x: r.minX, y: y)); ctx.addLine(to: CGPoint(x: r.maxX, y: y)); y += gap }
        ctx.strokePath()
    }

    private func drawRuled(_ ctx: CGContext, _ r: CGRect) {
        let gap  = r.height / 18
        let mL   = r.minX + r.width * 0.1
        let sY   = r.minY + r.height * 0.06
        ctx.setStrokeColor(UIColor(red: 0.77, green: 0.82, blue: 0.88, alpha: 1).cgColor)
        ctx.setLineWidth(0.5)
        var y = sY
        while y < r.maxY { ctx.move(to: CGPoint(x: r.minX, y: y)); ctx.addLine(to: CGPoint(x: r.maxX, y: y)); y += gap }
        ctx.strokePath()
        ctx.setStrokeColor(UIColor(red: 1, green: 0.67, blue: 0.67, alpha: 1).cgColor)
        ctx.setLineWidth(1)
        ctx.move(to: CGPoint(x: mL, y: r.minY)); ctx.addLine(to: CGPoint(x: mL, y: r.maxY))
        ctx.strokePath()
    }

    private func drawCornell(_ ctx: CGContext, _ r: CGRect) {
        let gap  = r.height / 18
        let hdrY = r.minY + r.height * 0.09
        let sumY = r.minY + r.height * 0.82
        let cueX = r.minX + r.width * 0.22
        ctx.setStrokeColor(UIColor(red: 0.77, green: 0.82, blue: 0.88, alpha: 1).cgColor)
        ctx.setLineWidth(0.5)
        var y = hdrY + gap
        while y < r.maxY { ctx.move(to: CGPoint(x: r.minX, y: y)); ctx.addLine(to: CGPoint(x: r.maxX, y: y)); y += gap }
        ctx.strokePath()
        ctx.setStrokeColor(UIColor(red: 1, green: 0.67, blue: 0.67, alpha: 1).cgColor)
        ctx.setLineWidth(1)
        ctx.move(to: CGPoint(x: r.minX, y: hdrY));  ctx.addLine(to: CGPoint(x: r.maxX, y: hdrY))
        ctx.move(to: CGPoint(x: cueX,   y: hdrY));  ctx.addLine(to: CGPoint(x: cueX,   y: sumY))
        ctx.move(to: CGPoint(x: r.minX, y: sumY));  ctx.addLine(to: CGPoint(x: r.maxX, y: sumY))
        ctx.strokePath()
    }

    private func drawThreeColumn(_ ctx: CGContext, _ r: CGRect) {
        let gap  = r.height / 18
        let sY   = r.minY + r.height * 0.06
        let col1 = r.minX + r.width / 3
        let col2 = r.minX + r.width * 2 / 3
        ctx.setStrokeColor(UIColor(red: 0.77, green: 0.82, blue: 0.88, alpha: 1).cgColor)
        ctx.setLineWidth(0.5)
        var y = sY
        while y < r.maxY { ctx.move(to: CGPoint(x: r.minX, y: y)); ctx.addLine(to: CGPoint(x: r.maxX, y: y)); y += gap }
        ctx.strokePath()
        ctx.setStrokeColor(UIColor(red: 1, green: 0.67, blue: 0.67, alpha: 1).cgColor)
        ctx.setLineWidth(1)
        ctx.move(to: CGPoint(x: col1, y: r.minY)); ctx.addLine(to: CGPoint(x: col1, y: r.maxY))
        ctx.move(to: CGPoint(x: col2, y: r.minY)); ctx.addLine(to: CGPoint(x: col2, y: r.maxY))
        ctx.strokePath()
    }
}

// MARK: - UIGestureRecognizerDelegate

extension DrawingCanvasView: UIGestureRecognizerDelegate {
    // Allow pinch and 2-finger pan to fire simultaneously with each other
    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
    ) -> Bool { true }
}

// MARK: - UIColor from hex

extension UIColor {
    convenience init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: h).scanHexInt64(&int)
        self.init(red:   CGFloat((int >> 16) & 0xFF) / 255,
                  green: CGFloat((int >> 8)  & 0xFF) / 255,
                  blue:  CGFloat( int        & 0xFF) / 255,
                  alpha: 1)
    }
}
