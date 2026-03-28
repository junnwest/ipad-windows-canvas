'use strict';

// CanvasEngine handles all drawing logic.
// Coordinates are stored normalized (0–1) so they are resolution-independent.
// Rendering converts to pixel coordinates at draw time.

class CanvasEngine {
  constructor(drawingCanvas, cursorCanvas) {
    this.dc = drawingCanvas;
    this.cc = cursorCanvas;
    this.ctx = drawingCanvas.getContext('2d');
    this.cctx = cursorCanvas.getContext('2d');

    // State
    this.pages = [[]];        // array of pages; each page = array of completed strokes
    this.currentPage = 0;
    this.redoStacks = [[]];   // per-page redo stacks
    this.activeStroke = null; // stroke in progress

    // Tool state
    this.tool = 'pen';
    this.color = '#1a1a1a';
    this.size = 2;

    this._dpr = 1;
    this._resize();
    this._bindEvents();

    window.addEventListener('resize', () => this._resize());
  }

  // ── Resize ──────────────────────────────────────────

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this._dpr = dpr;

    const w = this.dc.offsetWidth;
    const h = this.dc.offsetHeight;

    this.dc.width = w * dpr;
    this.dc.height = h * dpr;
    this.cc.width = w * dpr;
    this.cc.height = h * dpr;

    this.ctx.scale(dpr, dpr);
    this.cctx.scale(dpr, dpr);

    this.redraw();
  }

  // ── Input binding ────────────────────────────────────

  _bindEvents() {
    const el = this.dc;
    el.addEventListener('pointerdown',   e => this._onDown(e), { passive: false });
    el.addEventListener('pointermove',   e => this._onMove(e), { passive: false });
    el.addEventListener('pointerup',     e => this._onUp(e));
    el.addEventListener('pointercancel', e => this._onUp(e));
  }

  _onDown(e) {
    e.preventDefault();
    // Ignore non-primary touches that aren't from a pen (allow two-finger gestures)
    if (e.pointerType === 'touch' && !e.isPrimary) return;

    this.dc.setPointerCapture(e.pointerId);
    const { nx, ny } = this._norm(e);
    const pressure = e.pressure > 0 ? e.pressure : 0.5;

    this.activeStroke = {
      id: this._uuid(),
      points: [{ x: nx, y: ny, p: pressure, t: Date.now() }],
      color: this.tool === 'eraser' ? null : this.color,
      size: this.size,
      tool: this.tool,
    };

    Bridge.send('stroke_begin', { stroke: this.activeStroke });
  }

  _onMove(e) {
    e.preventDefault();
    if (!this.activeStroke) return;
    if (e.pointerType === 'touch' && !e.isPrimary) return;

    // Use getCoalescedEvents when available for smoother Apple Pencil strokes
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

    for (const ev of events) {
      const { nx, ny } = this._norm(ev);
      const pressure = ev.pressure > 0 ? ev.pressure : 0.5;
      const pt = { x: nx, y: ny, p: pressure, t: Date.now() };
      this.activeStroke.points.push(pt);
    }

    this._renderActive();

    // Batch-send points every 4 points
    const pts = this.activeStroke.points;
    if (pts.length % 4 === 0) {
      Bridge.send('stroke_points', {
        id: this.activeStroke.id,
        points: pts.slice(-4),
      });
    }
  }

  _onUp(e) {
    if (!this.activeStroke) return;
    if (e.pointerType === 'touch' && !e.isPrimary) return;

    const stroke = this.activeStroke;
    this.activeStroke = null;

    this.pages[this.currentPage].push(stroke);
    this.redoStacks[this.currentPage] = []; // new stroke clears redo
    this.redraw();

    Bridge.send('stroke_end', { id: stroke.id });
  }

  // ── Normalization ────────────────────────────────────

  _norm(e) {
    const rect = this.dc.getBoundingClientRect();
    return {
      nx: (e.clientX - rect.left) / rect.width,
      ny: (e.clientY - rect.top) / rect.height,
    };
  }

  // ── Drawing ──────────────────────────────────────────

  redraw() {
    const w = this.dc.offsetWidth;
    const h = this.dc.offsetHeight;
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, w, h);
    for (const stroke of this.pages[this.currentPage]) {
      this._drawStroke(stroke, w, h);
    }
  }

  _renderActive() {
    this.redraw();
    if (this.activeStroke) {
      const w = this.dc.offsetWidth;
      const h = this.dc.offsetHeight;
      this._drawStroke(this.activeStroke, w, h);
    }
  }

  _drawStroke(stroke, w, h) {
    const pts = stroke.points;
    if (pts.length === 0) return;

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = stroke.color;
    }

    if (pts.length === 1) {
      // Single dot
      const p = pts[0];
      this.ctx.beginPath();
      const r = (stroke.size * (p.p || 0.5));
      this.ctx.arc(p.x * w, p.y * h, Math.max(0.5, r), 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
      this.ctx.fill();
    } else {
      this.ctx.beginPath();
      this.ctx.moveTo(pts[0].x * w, pts[0].y * h);

      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        // Smooth with midpoint
        const mx = ((prev.x + curr.x) / 2) * w;
        const my = ((prev.y + curr.y) / 2) * h;
        this.ctx.lineWidth = stroke.size * ((curr.p || 0.5) * 1.5 + 0.5);
        this.ctx.quadraticCurveTo(prev.x * w, prev.y * h, mx, my);
      }

      // Last point
      const last = pts[pts.length - 1];
      this.ctx.lineTo(last.x * w, last.y * h);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // ── Cursor overlay ───────────────────────────────────

  // Called when Windows cursor position updates (connected mode)
  setCursor(nx, ny) {
    const w = this.cc.offsetWidth;
    const h = this.cc.offsetHeight;
    this.cctx.clearRect(0, 0, w, h);

    if (nx < 0 || ny < 0) return; // hide

    const x = nx * w;
    const y = ny * h;

    // Arrow cursor shape (simplified circle + cross)
    this.cctx.save();
    this.cctx.beginPath();
    this.cctx.arc(x, y, 6, 0, Math.PI * 2);
    this.cctx.fillStyle = 'rgba(0, 80, 200, 0.85)';
    this.cctx.fill();
    this.cctx.strokeStyle = '#ffffff';
    this.cctx.lineWidth = 1.5;
    this.cctx.stroke();
    this.cctx.restore();
  }

  // ── Undo / Redo ──────────────────────────────────────

  undo() {
    const page = this.pages[this.currentPage];
    if (page.length === 0) return;
    const stroke = page.pop();
    this.redoStacks[this.currentPage].push(stroke);
    this.redraw();
    Bridge.send('action', { action: 'undo' });
  }

  redo() {
    const stack = this.redoStacks[this.currentPage];
    if (stack.length === 0) return;
    const stroke = stack.pop();
    this.pages[this.currentPage].push(stroke);
    this.redraw();
    Bridge.send('action', { action: 'redo' });
  }

  // ── Page management ──────────────────────────────────

  addPage() {
    this.pages.push([]);
    this.redoStacks.push([]);
    this.currentPage = this.pages.length - 1;
    this.redraw();
    Bridge.send('action', { action: 'page_add' });
    return this.currentPage;
  }

  switchPage(index) {
    if (index < 0 || index >= this.pages.length) return;
    this.currentPage = index;
    this.redraw();
    Bridge.send('action', { action: 'page_switch', page: index });
  }

  get pageCount() { return this.pages.length; }

  // ── External state load (from host) ─────────────────

  loadPageState(state) {
    // state: { currentPage, pageCount, pages: [[strokes], ...] }
    if (state.pages) {
      this.pages = state.pages.map(p => p || []);
      this.redoStacks = this.pages.map(() => []);
    }
    if (typeof state.currentPage === 'number') {
      this.currentPage = state.currentPage;
    }
    this.redraw();
  }

  getPageState() {
    return {
      currentPage: this.currentPage,
      pageCount: this.pages.length,
      pages: this.pages,
    };
  }

  // ── Helpers ──────────────────────────────────────────

  _uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}
