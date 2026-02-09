class CanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.container = this.canvas.parentElement;
    this.strokes = new Map();
    this.isDrawing = false;
    this.currentStrokeId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupMouseDrawing();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Preserve existing content: copy old buffer, resize, paste back
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;
    let imageData = null;
    if (oldWidth > 0 && oldHeight > 0) {
      imageData = this.ctx.getImageData(0, 0, oldWidth, oldHeight);
    }

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);

    // Restore at original position (no scaling)
    if (imageData) {
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  setupMouseDrawing() {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
  }

  onPointerDown(e) {
    this.isDrawing = true;
    this.currentStrokeId = crypto.randomUUID();

    this.canvas.setPointerCapture(e.pointerId);

    const point = this.getPointFromEvent(e);

    this.strokes.set(this.currentStrokeId, {
      id: this.currentStrokeId,
      points: [point],
      color: '#000000',
      width: 2.0,
      tool: 'pen',
    });

    // Draw a dot immediately for single-click visibility
    const radius = Math.max(1, 2.0 * point.pressure / 2);
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#000000';
    this.ctx.fill();

    // Prepare line path for subsequent moves
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(point.x, point.y);
  }

  onPointerMove(e) {
    if (!this.isDrawing || !this.currentStrokeId) return;

    const point = this.getPointFromEvent(e);
    const stroke = this.strokes.get(this.currentStrokeId);
    if (!stroke) return;

    stroke.points.push(point);

    this.ctx.lineWidth = stroke.width * point.pressure;
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  }

  onPointerUp(e) {
    if (!this.isDrawing) return;
    this.canvas.releasePointerCapture(e.pointerId);
    this.isDrawing = false;
    this.currentStrokeId = null;
    this.ctx.beginPath();
  }

  // Returns point in CSS pixel coordinates (not normalized)
  getPointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    // Clamp to canvas bounds
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return {
      x,
      y,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
      timestamp: Date.now(),
    };
  }

  // Called when receiving stroke data from iPad via WebSocket.
  // iPad sends normalized (0-1) coordinates; convert to current pixel size.
  handleStrokeUpdate(strokeData) {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Convert normalized iPad points to CSS pixels
    const pixelPoints = strokeData.points.map((p) => ({
      x: p.x * w,
      y: p.y * h,
      pressure: p.pressure,
      timestamp: p.timestamp,
    }));

    let stroke = this.strokes.get(strokeData.id);
    if (!stroke) {
      stroke = {
        id: strokeData.id,
        points: [],
        color: strokeData.color || '#000000',
        width: strokeData.width || 2.0,
        tool: strokeData.tool || 'pen',
      };
      this.strokes.set(strokeData.id, stroke);
    }

    const startIndex = stroke.points.length;
    stroke.points.push(...pixelPoints);

    this.renderStrokeSegment(stroke, startIndex);
  }

  renderStrokeSegment(stroke, startIndex = 0) {
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = Math.max(1, startIndex); i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];

      this.ctx.beginPath();
      this.ctx.lineWidth = stroke.width * curr.pressure;
      this.ctx.moveTo(prev.x, prev.y);
      this.ctx.lineTo(curr.x, curr.y);
      this.ctx.stroke();
    }

    // Handle single-point stroke (dot)
    if (stroke.points.length === 1 && startIndex === 0) {
      const p = stroke.points[0];
      const radius = Math.max(1, stroke.width * p.pressure / 2);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.color;
      this.ctx.fill();
    }
  }

  redrawAll() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokes.forEach((stroke) => {
      this.renderStrokeSegment(stroke, 0);
    });
  }

  clear() {
    this.strokes.clear();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
