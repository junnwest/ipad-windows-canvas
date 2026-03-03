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
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.texts = [];
    this._textInput      = null;
    this._editingTextId  = null;
    this._editingNormX   = 0;
    this._editingNormY   = 0;

    this.images            = [];
    this._imageCache       = new Map();   // id → HTMLImageElement
    this._selectedImageId  = null;
    this._draggingImageId  = null;
    this._draggingStartNorm      = null;  // { x, y } cursor norm at drag start
    this._draggingImageStartPos  = null;  // { x, y } image top-left at drag start

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupMouseDrawing();
    this.setupZoomPan();
    this.setupTextEditing();
    this.setupImageHandling();
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

    // Reset zoom/pan whenever the window is resized
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._applyTransform();

    this.ctx.scale(dpr, dpr);  // canvas.width assignment resets the context, so this is safe
    this.redrawAll();
  }

  // CSS pixel dimensions of the canvas element
  _cw() { return this.canvas.clientWidth; }
  _ch() { return this.canvas.clientHeight; }

  // --- Zoom / pan ---

  _applyTransform() {
    this.canvas.style.transformOrigin = '0 0';
    this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  resetZoom() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._applyTransform();
  }

  setupZoomPan() {
    // Ctrl+wheel = zoom toward cursor; plain wheel = pan
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const factor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        const newZoom = Math.max(0.25, Math.min(8, this.zoom * factor));
        if (newZoom === this.zoom) return;
        // Canvas origin in container space (offsetLeft/Top are the un-transformed CSS values)
        const l = this.canvas.offsetLeft;
        const t = this.canvas.offsetTop;
        const ox = l + this.panX;
        const oy = t + this.panY;
        // Cursor in container space
        const cRect = this.container.getBoundingClientRect();
        const mx = e.clientX - cRect.left;
        const my = e.clientY - cRect.top;
        // Shift origin so the point under the cursor stays fixed
        this.panX = mx - (mx - ox) * newZoom / this.zoom - l;
        this.panY = my - (my - oy) * newZoom / this.zoom - t;
        this.zoom = newZoom;
      } else {
        this.panX -= e.deltaX;
        this.panY -= e.deltaY;
      }
      this._applyTransform();
    }, { passive: false });

    // Middle-mouse drag = pan
    let panning = false, lastMX = 0, lastMY = 0;
    this.container.addEventListener('mousedown', (e) => {
      if (e.button !== 1) return;
      panning = true;
      lastMX = e.clientX;
      lastMY = e.clientY;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!panning) return;
      this.panX += e.clientX - lastMX;
      this.panY += e.clientY - lastMY;
      lastMX = e.clientX;
      lastMY = e.clientY;
      this._applyTransform();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 1) panning = false;
    });
  }

  // --- Text tool ---

  // --- Image tool ---

  setupImageHandling() {
    // Delete key removes the selected image when the text input is not focused
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Delete') return;
      if (this._textInput && this._textInput === document.activeElement) return;
      if (!this._selectedImageId) return;
      this.images = this.images.filter(img => img.id !== this._selectedImageId);
      this._imageCache.delete(this._selectedImageId);
      this._selectedImageId = null;
      this.redrawAll();
      this._notifyHistoryChange();
    });
  }

  // Called from app.js after the user picks a file via IPC
  addImage(src, naturalWidth, naturalHeight) {
    const w = this._cw(), h = this._ch();
    const normW = 0.5;  // default: image fills half the page width
    const normH = Math.min(0.9, normW * (naturalHeight / naturalWidth) * (w / h));
    const id = crypto.randomUUID();
    const el = new Image();
    el.onload = () => this.redrawAll();
    el.src = src;
    this._imageCache.set(id, el);
    this.images.push({
      id,
      x: Math.max(0, 0.5 - normW / 2),
      y: Math.max(0, 0.5 - normH / 2),
      width:  normW,
      height: normH,
      src,
    });
    this.redrawAll();
    this._notifyHistoryChange();
  }

  importImageData(images) {
    this.images = images ? [...images] : [];
    this._imageCache.clear();
    this._selectedImageId = null;
    for (const img of this.images) {
      const el = new Image();
      el.onload = () => this.redrawAll();
      el.src = img.src;
      this._imageCache.set(img.id, el);
    }
  }

  exportImageData() {
    return [...this.images];
  }

  _findImageAt(nx, ny) {
    for (let i = this.images.length - 1; i >= 0; i--) {
      const img = this.images[i];
      if (nx >= img.x && nx <= img.x + img.width &&
          ny >= img.y && ny <= img.y + img.height) {
        return img;
      }
    }
    return null;
  }

  _drawImages(w, h) {
    for (const img of this.images) {
      const el = this._imageCache.get(img.id);
      if (!el || !el.complete || el.naturalWidth === 0) continue;
      this.ctx.drawImage(el, img.x * w, img.y * h, img.width * w, img.height * h);
    }
    // Selection border around selected image (text/select tool only)
    if (this._selectedImageId) {
      const img = this.images.find(i => i.id === this._selectedImageId);
      if (img) {
        this.ctx.strokeStyle = '#5a7de8';
        this.ctx.lineWidth   = 2;
        this.ctx.setLineDash([6, 3]);
        this.ctx.strokeRect(img.x * w - 2, img.y * h - 2, img.width * w + 4, img.height * h + 4);
        this.ctx.setLineDash([]);
      }
    }
  }

  importTextData(texts) {
    this.texts = texts ? [...texts] : [];
    this.redrawAll();
  }

  exportTextData() {
    return [...this.texts];
  }

  setupTextEditing() {
    const input = document.createElement('input');
    input.type = 'text';
    input.id   = 'text-tool-input';
    this.container.appendChild(input);
    this._textInput = input;

    input.addEventListener('blur',    () => this._commitText());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); this._cancelText(); }
      e.stopPropagation();  // prevent keyboard shortcuts while typing
    });
  }

  _showTextInput(normX, normY, existing) {
    const input    = this._textInput;
    const cRect    = this.canvas.getBoundingClientRect();
    const contRect = this.container.getBoundingClientRect();
    const fontSize = existing ? existing.fontSize : 0.04;  // fraction of canvas height
    const screenFontSize = fontSize * cRect.height;
    const screenX = cRect.left - contRect.left + normX * cRect.width;
    const screenY = cRect.top  - contRect.top  + normY * cRect.height;

    this._editingNormX  = normX;
    this._editingNormY  = normY;
    this._editingTextId = existing ? existing.id : null;

    input.style.left     = screenX + 'px';
    input.style.top      = screenY + 'px';
    input.style.fontSize = screenFontSize + 'px';
    input.style.color    = existing ? existing.color : this.toolState.currentColor;
    input.value = existing ? existing.content : '';
    input.style.display = 'block';
    // Grow width to fit content (min 120px)
    input.style.width = Math.max(120, input.value.length * screenFontSize * 0.62 + 24) + 'px';
    input.focus();
    input.select();
  }

  _commitText() {
    const input   = this._textInput;
    const content = input.value;
    input.style.display = 'none';

    if (this._editingTextId !== null) {
      const idx = this.texts.findIndex(t => t.id === this._editingTextId);
      if (idx >= 0) {
        if (content.trim() === '') {
          this.texts.splice(idx, 1);
        } else {
          this.texts[idx] = { ...this.texts[idx], content };
        }
      }
    } else if (content.trim() !== '') {
      this.texts.push({
        id:       crypto.randomUUID(),
        x:        this._editingNormX,
        y:        this._editingNormY,
        content,
        fontSize: 0.04,  // fraction of canvas height
        color:    this.toolState.currentColor,
      });
    }
    this._editingTextId = null;
    this.redrawAll();
    if (this.onHistoryChange) this.onHistoryChange();  // trigger autosave / broadcast
  }

  _cancelText() {
    this._textInput.style.display = 'none';
    this._editingTextId = null;
  }

  _findTextAt(nx, ny) {
    const h = this._ch();
    for (const text of [...this.texts].reverse()) {
      const fs = text.fontSize * h;
      this.ctx.font = `${fs}px sans-serif`;
      const textW = this.ctx.measureText(text.content).width / this._cw();
      const textH = text.fontSize;
      if (nx >= text.x - 0.005 && nx <= text.x + textW + 0.005 &&
          ny >= text.y - 0.005 && ny <= text.y + textH + 0.005) {
        return text;
      }
    }
    return null;
  }

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

    if (this.toolState.currentTool === 'text') {
      const imgHit = this._findImageAt(normPoint.x, normPoint.y);
      if (imgHit) {
        // Select and start dragging the image
        this._commitText();
        this._selectedImageId         = imgHit.id;
        this._draggingImageId         = imgHit.id;
        this._draggingStartNorm       = { x: normPoint.x, y: normPoint.y };
        this._draggingImageStartPos   = { x: imgHit.x,    y: imgHit.y };
        this.canvas.setPointerCapture(e.pointerId);
        this.redrawAll();
        return;
      }
      // No image hit — open text editor (and deselect any image)
      this._selectedImageId = null;
      const hit = this._findTextAt(normPoint.x, normPoint.y);
      this._showTextInput(hit ? hit.x : normPoint.x, hit ? hit.y : normPoint.y, hit || null);
      return;
    }

    // Dismiss any open text input before drawing/erasing
    if (this._textInput && this._textInput.style.display !== 'none') {
      this._textInput.blur();  // triggers _commitText via blur event
    }
    // Deselect any selected image
    if (this._selectedImageId) {
      this._selectedImageId = null;
      this.redrawAll();
    }

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
    this.ctx.beginPath();
    this.ctx.arc(px, py, Math.max(1, stroke.width * normPoint.pressure / 2), 0, Math.PI * 2);
    this.ctx.fillStyle = stroke.color;
    this.ctx.fill();
  }

  onPointerMove(e) {
    if (this._draggingImageId) {
      const norm = this.normalizePoint(this.getPointFromEvent(e));
      const dx = norm.x - this._draggingStartNorm.x;
      const dy = norm.y - this._draggingStartNorm.y;
      const img = this.images.find(i => i.id === this._draggingImageId);
      if (img) {
        img.x = Math.max(0, Math.min(1 - img.width,  this._draggingImageStartPos.x + dx));
        img.y = Math.max(0, Math.min(1 - img.height, this._draggingImageStartPos.y + dy));
        this.redrawAll();
      }
      return;
    }
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
    const pts = stroke.points;
    const n   = pts.length;
    const w   = this._cw(), h = this._ch();
    const p1  = pts[n - 2];
    const p2  = pts[n - 1];

    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineCap     = 'round';
    this.ctx.lineJoin    = 'round';
    this.ctx.lineWidth   = stroke.width * p2.pressure;
    this.ctx.beginPath();

    if (n >= 3) {
      const p0  = pts[n - 3];
      const mx0 = ((p0.x + p1.x) / 2) * w;
      const my0 = ((p0.y + p1.y) / 2) * h;
      const mx1 = ((p1.x + p2.x) / 2) * w;
      const my1 = ((p1.y + p2.y) / 2) * h;
      this.ctx.moveTo(mx0, my0);
      this.ctx.quadraticCurveTo(p1.x * w, p1.y * h, mx1, my1);
    } else {
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
    }
    this.ctx.stroke();
  }

  onPointerUp(e) {
    if (this._draggingImageId) {
      this._draggingImageId        = null;
      this._draggingStartNorm      = null;
      this._draggingImageStartPos  = null;
      this.canvas.releasePointerCapture(e.pointerId);
      this._notifyHistoryChange();
      return;
    }
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
      this.redrawAll();  // re-render with smooth curves now that all points are known
      this._notifyHistoryChange();
    }
    this.currentStrokeId = null;
  }

  getPointFromEvent(e) {
    // getBoundingClientRect reflects the CSS-transformed (visual) size, so we divide
    // by zoom to recover canvas CSS-pixel coordinates for normalisation.
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(this._cw(), (e.clientX - rect.left) / this.zoom)),
      y: Math.max(0, Math.min(this._ch(), (e.clientY - rect.top)  / this.zoom)),
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
      this.redrawAll();  // re-render with smooth curves now that all points are known
      this._notifyHistoryChange();
    }
  }

  // --- Rendering ---

  renderStrokeSegment(stroke, startIndex = 0) {
    const pts = stroke.points;
    const w   = this._cw(), h = this._ch();

    if (pts.length === 1 && startIndex === 0) {
      const p = pts[0];
      this.ctx.beginPath();
      this.ctx.arc(p.x * w, p.y * h, Math.max(1, stroke.width * p.pressure / 2), 0, Math.PI * 2);
      this.ctx.fillStyle = stroke.color;
      this.ctx.fill();
      return;
    }

    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineCap     = 'round';
    this.ctx.lineJoin    = 'round';

    for (let i = Math.max(1, startIndex); i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      this.ctx.beginPath();
      this.ctx.lineWidth = stroke.width * ((p0.pressure + p1.pressure) / 2);

      if (i >= 2) {
        // Midpoint quadratic smoothing: curve through p0, landing at the midpoint between p0 and p1
        const pPrev = pts[i - 2];
        const mx0 = ((pPrev.x + p0.x) / 2) * w;
        const my0 = ((pPrev.y + p0.y) / 2) * h;
        const mx1 = ((p0.x + p1.x) / 2) * w;
        const my1 = ((p0.y + p1.y) / 2) * h;
        this.ctx.moveTo(mx0, my0);
        this.ctx.quadraticCurveTo(p0.x * w, p0.y * h, mx1, my1);
      } else {
        this.ctx.moveTo(p0.x * w, p0.y * h);
        this.ctx.lineTo(p1.x * w, p1.y * h);
      }
      this.ctx.stroke();
    }
  }

  redrawAll() {
    const w = this._cw(), h = this._ch();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, w, h);
    this._drawTemplate(w, h);
    this._drawImages(w, h);   // images sit above template, below strokes

    this.history.getActiveStrokes().forEach((stroke) => {
      this.renderStrokeSegment(stroke, 0);
    });
    this.pendingStrokes.forEach((stroke) => {
      this.renderStrokeSegment(stroke, 0);
    });

    // Render text elements on top of strokes
    this.ctx.textBaseline = 'top';
    this.texts.forEach((text) => {
      const fontSize = text.fontSize * h;
      this.ctx.font      = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      this.ctx.fillStyle = text.color;
      this.ctx.fillText(text.content, text.x * w, text.y * h);
    });
    this.ctx.textBaseline = 'alphabetic';  // restore default
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

  importPageData(strokes, texts, images) {
    this.history.reset();
    this.pendingStrokes.clear();
    if (strokes && strokes.length > 0) {
      for (const stroke of strokes) {
        this.history.push({ type: 'add_stroke', stroke });
      }
    }
    this.texts = texts ? [...texts] : [];
    this.importImageData(images);
    this.redrawAll();
    this._notifyHistoryChange();
  }

  _notifyHistoryChange() {
    if (this.onHistoryChange) this.onHistoryChange();
  }
}
