// Page size definitions — also used by page-setup.js and export.js
const PAGE_SIZES = {
  'a4-landscape':     { widthMm: 297,   heightMm: 210,   label: 'A4 Landscape' },
  'a4-portrait':      { widthMm: 210,   heightMm: 297,   label: 'A4 Portrait' },
  'letter-landscape': { widthMm: 279.4, heightMm: 215.9, label: 'Letter Landscape' },
  'letter-portrait':  { widthMm: 215.9, heightMm: 279.4, label: 'Letter Portrait' },
  'square':           { widthMm: 210,   heightMm: 210,   label: 'Square' },
};
const DEFAULT_PAGE_SIZE = 'a4-landscape';
const DEFAULT_TEMPLATE  = 'blank';

class CanvasRenderer {
  constructor(canvasElement, toolState) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.container = this.canvas.parentElement;
    this.toolState = toolState;
    this.history = new ActionHistory();
    this.pendingStrokes = new Map();
    this.isDrawing = false;
    this.currentStrokeId = null;
    this.isErasing = false;
    this.onHistoryChange = null;
    this._pageSizeKey = DEFAULT_PAGE_SIZE;
    this._template = DEFAULT_TEMPLATE;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupMouseDrawing();
  }

  // Called by NotebookManager when switching pages or loading a notebook
  setPageConfig(pageSizeKey, template) {
    this._pageSizeKey = pageSizeKey || DEFAULT_PAGE_SIZE;
    this._template = template || DEFAULT_TEMPLATE;
    this.resize();
  }

  // --- Layout: enforce page aspect ratio, centre in grey container ---

  resize() {
    const padding = 28;
    const containerW = this.container.clientWidth;
    const containerH = this.container.clientHeight;
    if (containerW === 0 || containerH === 0) return;

    const ps = PAGE_SIZES[this._pageSizeKey] || PAGE_SIZES[DEFAULT_PAGE_SIZE];
    const ratio = ps.widthMm / ps.heightMm;
    const availW = containerW - padding * 2;
    const availH = containerH - padding * 2;

    let canvasW, canvasH;
    if (availW / availH > ratio) {
      canvasH = availH;
      canvasW = canvasH * ratio;
    } else {
      canvasW = availW;
      canvasH = canvasW / ratio;
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = Math.round(canvasW * dpr);
    this.canvas.height = Math.round(canvasH * dpr);
    this.canvas.style.width  = Math.round(canvasW) + 'px';
    this.canvas.style.height = Math.round(canvasH) + 'px';
    this.canvas.style.left   = Math.round((containerW - canvasW) / 2) + 'px';
    this.canvas.style.top    = Math.round((containerH - canvasH) / 2) + 'px';

    this.ctx.scale(dpr, dpr);  // canvas.width assignment resets the context, so this is safe
    this.redrawAll();
  }

  // CSS pixel dimensions of the canvas element
  _cw() { return this.canvas.clientWidth; }
  _ch() { return this.canvas.clientHeight; }

  // --- Mouse / pen drawing ---

  setupMouseDrawing() {
    this.canvas.addEventListener('pointerdown',   (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove',   (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup',     (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
  }

  normalizePoint(point) {
    // point.x / point.y are already relative to the canvas element (from getPointFromEvent)
    const w = this._cw();
    const h = this._ch();
    return {
      x: w > 0 ? point.x / w : 0,
      y: h > 0 ? point.y / h : 0,
      pressure: point.pressure,
      timestamp: point.timestamp,
    };
  }

  onPointerDown(e) {
    const rawPoint  = this.getPointFromEvent(e);
    const normPoint = this.normalizePoint(rawPoint);

    if (this.toolState.currentTool === 'eraser') {
      this.isErasing = true;
      this.canvas.setPointerCapture(e.pointerId);
      this._eraseAt(normPoint.x, normPoint.y);
      return;
    }

    this.isDrawing = true;
    this.currentStrokeId = crypto.randomUUID();
    this.canvas.setPointerCapture(e.pointerId);

    const stroke = {
      id: this.currentStrokeId,
      points: [normPoint],
      color: this.toolState.currentColor,
      width: this.toolState.currentSize,
      tool: 'pen',
    };
    this.pendingStrokes.set(this.currentStrokeId, stroke);

    // Draw initial dot
    const px = normPoint.x * this._cw();
    const py = normPoint.y * this._ch();
    const radius = Math.max(1, stroke.width * normPoint.pressure / 2);
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = stroke.color;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineCap  = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(px, py);
  }

  onPointerMove(e) {
    if (this.isErasing) {
      const norm = this.normalizePoint(this.getPointFromEvent(e));
      this._eraseAt(norm.x, norm.y);
      return;
    }
    if (!this.isDrawing || !this.currentStrokeId) return;

    const normPoint = this.normalizePoint(this.getPointFromEvent(e));
    const stroke = this.pendingStrokes.get(this.currentStrokeId);
    if (!stroke) return;

    stroke.points.push(normPoint);
    const px = normPoint.x * this._cw();
    const py = normPoint.y * this._ch();
    this.ctx.lineWidth = stroke.width * normPoint.pressure;
    this.ctx.lineTo(px, py);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(px, py);
  }

  onPointerUp(e) {
    if (this.isErasing) {
      this.isErasing = false;
      this.canvas.releasePointerCapture(e.pointerId);
      return;
    }
    if (!this.isDrawing) return;
    this.canvas.releasePointerCapture(e.pointerId);
    this.isDrawing = false;

    const stroke = this.pendingStrokes.get(this.currentStrokeId);
    if (stroke && stroke.points.length > 0) {
      this.pendingStrokes.delete(this.currentStrokeId);
      this.history.push({ type: 'add_stroke', stroke });
      this._notifyHistoryChange();
    }
    this.currentStrokeId = null;
    this.ctx.beginPath();
  }

  getPointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width,  e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
      pressure: e.pressure > 0 ? e.pressure : 0.5,
      timestamp: Date.now(),
    };
  }

  // --- Eraser ---

  _eraseAt(normX, normY) {
    const threshold = 0.015;
    const activeStrokes = this.history.getActiveStrokes();
    let closestId   = null;
    let closestDist = Infinity;

    activeStrokes.forEach((stroke) => {
      const dist = this._distToStroke(normX, normY, stroke);
      if (dist < threshold && dist < closestDist) {
        closestDist = dist;
        closestId   = stroke.id;
      }
    });

    if (closestId) {
      this.history.push({ type: 'erase_stroke', strokeId: closestId });
      this.redrawAll();
      this._notifyHistoryChange();
    }
  }

  _distToStroke(px, py, stroke) {
    const pts = stroke.points;
    if (pts.length === 1) {
      const dx = px - pts[0].x, dy = py - pts[0].y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    let minDist = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const d = this._distToSegment(px, py, pts[i - 1], pts[i]);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  _distToSegment(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      const ex = px - a.x, ey = py - a.y;
      return Math.sqrt(ex * ex + ey * ey);
    }
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx, cy = a.y + t * dy;
    const ex = px - cx, ey = py - cy;
    return Math.sqrt(ex * ex + ey * ey);
  }

  handleEraseAt(normX, normY) { this._eraseAt(normX, normY); }

  // --- iPad strokes ---

  handleStrokeUpdate(strokeData) {
    let stroke = this.pendingStrokes.get(strokeData.id);
    if (!stroke) {
      stroke = {
        id:    strokeData.id,
        points: [],
        color: strokeData.color || '#000000',
        width: strokeData.width || 2.0,
        tool:  strokeData.tool  || 'pen',
      };
      this.pendingStrokes.set(strokeData.id, stroke);
    }
    const startIndex = stroke.points.length;
    stroke.points.push(...strokeData.points);
    this.renderStrokeSegment(stroke, startIndex);
  }

  handleStrokeComplete(strokeId) {
    const stroke = this.pendingStrokes.get(strokeId);
    if (stroke) {
      this.pendingStrokes.delete(strokeId);
      this.history.push({ type: 'add_stroke', stroke });
      this._notifyHistoryChange();
    }
  }

  // --- Rendering ---

  renderStrokeSegment(stroke, startIndex = 0) {
    const w = this._cw(), h = this._ch();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineCap  = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = Math.max(1, startIndex); i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      this.ctx.beginPath();
      this.ctx.lineWidth = stroke.width * curr.pressure;
      this.ctx.moveTo(prev.x * w, prev.y * h);
      this.ctx.lineTo(curr.x * w, curr.y * h);
      this.ctx.stroke();
    }

    if (stroke.points.length === 1 && startIndex === 0) {
      const p = stroke.points[0];
      const radius = Math.max(1, stroke.width * p.pressure / 2);
      this.ctx.beginPath();
      this.ctx.arc(p.x * w, p.y * h, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.color;
      this.ctx.fill();
    }
  }

  redrawAll() {
    const w = this._cw(), h = this._ch();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, w, h);
    this._drawTemplate(w, h);

    this.history.getActiveStrokes().forEach((stroke) => {
      this.renderStrokeSegment(stroke, 0);
    });
    this.pendingStrokes.forEach((stroke) => {
      this.renderStrokeSegment(stroke, 0);
    });
  }

  // --- Template drawing ---

  _drawTemplate(w, h) {
    if (this._template === 'blank') return;
    const ps  = PAGE_SIZES[this._pageSizeKey] || PAGE_SIZES[DEFAULT_PAGE_SIZE];
    const ppm = w / ps.widthMm; // CSS pixels per mm
    this.ctx.save();
    switch (this._template) {
      case 'dotted':       this._tplDotted(w, h, ppm);       break;
      case 'squared':      this._tplSquared(w, h, ppm);      break;
      case 'ruled-narrow': this._tplRuled(w, h, ppm);        break;
      case 'cornell':      this._tplCornell(w, h, ppm);      break;
      case 'three-column': this._tplThreeColumn(w, h, ppm);  break;
    }
    this.ctx.restore();
  }

  _tplDotted(w, h, ppm) {
    const gap = 5 * ppm, margin = 8 * ppm;
    this.ctx.fillStyle = '#bbbbbb';
    for (let y = margin; y < h - margin + 1; y += gap) {
      for (let x = margin; x < w - margin + 1; x += gap) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1.0, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  _tplSquared(w, h, ppm) {
    const gap = 5 * ppm;
    this.ctx.strokeStyle = '#d8d8d8';
    this.ctx.lineWidth = 0.5;
    for (let x = 0; x <= w + 1; x += gap) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, h); this.ctx.stroke();
    }
    for (let y = 0; y <= h + 1; y += gap) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
    }
  }

  _tplRuled(w, h, ppm) {
    const lineGap    = 7  * ppm;
    const marginLeft = 25 * ppm;
    const startY     = 15 * ppm;
    this.ctx.strokeStyle = '#c4d0e0';
    this.ctx.lineWidth = 0.5;
    for (let y = startY; y < h; y += lineGap) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
    }
    this.ctx.strokeStyle = '#ffaaaa';
    this.ctx.lineWidth = 0.75;
    this.ctx.beginPath(); this.ctx.moveTo(marginLeft, 0); this.ctx.lineTo(marginLeft, h); this.ctx.stroke();
  }

  _tplCornell(w, h, ppm) {
    const lineGap  = 7  * ppm;
    const headerH  = 18 * ppm;
    const summaryY = h - 45 * ppm;
    const cueX     = 62 * ppm;
    this.ctx.strokeStyle = '#c4d0e0';
    this.ctx.lineWidth = 0.5;
    for (let y = headerH + lineGap; y < h; y += lineGap) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
    }
    this.ctx.strokeStyle = '#ffaaaa';
    this.ctx.lineWidth = 0.75;
    this.ctx.beginPath(); this.ctx.moveTo(0, headerH);  this.ctx.lineTo(w, headerH);  this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(cueX, headerH); this.ctx.lineTo(cueX, summaryY); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(0, summaryY); this.ctx.lineTo(w, summaryY); this.ctx.stroke();
  }

  _tplThreeColumn(w, h, ppm) {
    const lineGap = 7  * ppm;
    const startY  = 15 * ppm;
    const col1 = w / 3, col2 = 2 * w / 3;
    this.ctx.strokeStyle = '#c4d0e0';
    this.ctx.lineWidth = 0.5;
    for (let y = startY; y < h; y += lineGap) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
    }
    this.ctx.strokeStyle = '#ffaaaa';
    this.ctx.lineWidth = 0.75;
    this.ctx.beginPath(); this.ctx.moveTo(col1, 0); this.ctx.lineTo(col1, h); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(col2, 0); this.ctx.lineTo(col2, h); this.ctx.stroke();
  }

  // --- History operations ---

  undo() {
    if (!this.history.canUndo()) return false;
    this.history.undo();
    this.redrawAll();
    this._notifyHistoryChange();
    return true;
  }

  redo() {
    if (!this.history.canRedo()) return false;
    this.history.redo();
    this.redrawAll();
    this._notifyHistoryChange();
    return true;
  }

  canUndo() { return this.history.canUndo(); }
  canRedo() { return this.history.canRedo(); }

  clear() {
    if (this.history.getActiveStrokes().size === 0 && this.pendingStrokes.size === 0) return;
    this.pendingStrokes.clear();
    this.history.push({ type: 'clear' });
    this.redrawAll();
    this._notifyHistoryChange();
  }

  // --- Persistence ---

  exportPageData() {
    const strokes = [];
    this.history.getActiveStrokes().forEach((stroke) => {
      strokes.push({ id: stroke.id, points: stroke.points, color: stroke.color, width: stroke.width, tool: stroke.tool });
    });
    return strokes;
  }

  importPageData(strokes) {
    this.history.reset();
    this.pendingStrokes.clear();
    if (strokes && strokes.length > 0) {
      for (const stroke of strokes) {
        this.history.push({ type: 'add_stroke', stroke });
      }
    }
    this.redrawAll();
    this._notifyHistoryChange();
  }

  _notifyHistoryChange() {
    if (this.onHistoryChange) this.onHistoryChange();
  }
}
