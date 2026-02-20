// PagesOverviewUI — modal grid showing all pages with thumbnails.
// Depends on PAGE_SIZES / DEFAULT_PAGE_SIZE / DEFAULT_TEMPLATE (defined in canvas.js).
class PagesOverviewUI {
  constructor(notebookManager) {
    this.notebookManager = notebookManager;
    this._copiedPage = null;

    this.onAddPage       = null; // () => void  — called after modal closes
    this.onStructureChange = null; // () => void — called after insert/delete

    this.overlay = document.getElementById('pages-overview-overlay');
    this.gridEl  = document.getElementById('pages-grid');

    document.getElementById('pages-overview-close').addEventListener('click', () => this.close());
    document.getElementById('pages-add-btn').addEventListener('click', () => {
      this.close();
      if (this.onAddPage) this.onAddPage();
    });

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) this.close();
    });
  }

  open() {
    this.notebookManager._saveCurrentPage(); // flush current strokes so thumbnail is accurate
    this._render();
    this.overlay.classList.remove('hidden');
  }

  close() { this.overlay.classList.add('hidden'); }

  // Called by app.js via onPageChange so the grid stays up to date while open
  refresh() {
    if (!this.overlay.classList.contains('hidden')) this._render();
  }

  _render() {
    const nb = this.notebookManager.notebook;
    this.gridEl.innerHTML = '';
    if (!nb) return;
    nb.pages.forEach((page, i) => this.gridEl.appendChild(this._createCard(page, i)));
  }

  _createCard(page, index) {
    const isCurrent = index === this.notebookManager.currentPageIndex;

    const card = document.createElement('div');
    card.className = 'page-card' + (isCurrent ? ' current' : '');

    // Thumbnail canvas
    const thumb = this._renderThumbnail(page);

    // Page number label
    const label = document.createElement('div');
    label.className = 'page-card-label';
    label.textContent = `Page ${index + 1}`;

    // Action row
    const actions = document.createElement('div');
    actions.className = 'page-card-actions';

    const copyBtn   = document.createElement('button');
    copyBtn.className = 'page-card-btn';
    copyBtn.textContent = 'Copy';

    const pasteBtn  = document.createElement('button');
    pasteBtn.className = 'page-card-btn';
    pasteBtn.textContent = 'Paste after';
    pasteBtn.disabled = !this._copiedPage;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'page-card-btn page-card-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.disabled = this.notebookManager.pageCount <= 1;

    actions.append(copyBtn, pasteBtn, deleteBtn);
    card.append(thumb, label, actions);

    // Switch to page on card click
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      this.notebookManager.switchToPage(index);
      this.close();
    });

    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._copiedPage = {
        strokes:  JSON.parse(JSON.stringify(page.strokes || [])),
        pageSize: page.pageSize || DEFAULT_PAGE_SIZE,
        template: page.template || DEFAULT_TEMPLATE,
      };
      this._render(); // refresh to enable all paste buttons
    });

    pasteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this._copiedPage) return;
      this.notebookManager.insertPage(index, this._copiedPage);
      if (this.onStructureChange) this.onStructureChange();
      // _render() will be triggered via onPageChange → refresh()
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.notebookManager.deletePage(index);
      if (this.onStructureChange) this.onStructureChange();
      // _render() will be triggered via onPageChange → refresh()
    });

    return card;
  }

  // ── Thumbnail rendering ───────────────────────────────────────────────────

  _renderThumbnail(page) {
    const ps = PAGE_SIZES[page.pageSize || DEFAULT_PAGE_SIZE] || PAGE_SIZES[DEFAULT_PAGE_SIZE];
    const ratio = ps.widthMm / ps.heightMm;
    const THUMB_H = 130;
    const THUMB_W = Math.round(THUMB_H * ratio);
    const DPR = 2;

    const cvs = document.createElement('canvas');
    cvs.width  = THUMB_W * DPR;
    cvs.height = THUMB_H * DPR;
    cvs.style.width  = THUMB_W + 'px';
    cvs.style.height = THUMB_H + 'px';
    cvs.className = 'page-thumb';

    const ctx = cvs.getContext('2d');
    ctx.scale(DPR, DPR);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, THUMB_W, THUMB_H);

    this._drawTemplate(ctx, page.template || 'blank', THUMB_W, THUMB_H);

    for (const stroke of (page.strokes || [])) {
      const pts = stroke.points;
      if (!pts || pts.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * THUMB_W, pts[0].y * THUMB_H);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * THUMB_W, pts[i].y * THUMB_H);
      }
      const avgP = pts.reduce((s, p) => s + (p.pressure || 0.5), 0) / pts.length;
      ctx.strokeStyle = stroke.color || '#000000';
      ctx.lineWidth   = Math.max(0.3, (stroke.width || 2) * avgP * THUMB_W / 900);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    return cvs;
  }

  _drawTemplate(ctx, template, w, h) {
    const gap = w / 22;
    if (template === 'dotted') {
      const margin = w / 25;
      ctx.fillStyle = '#c0c0c0';
      for (let y = margin; y < h - margin + 1; y += gap) {
        for (let x = margin; x < w - margin + 1; x += gap) {
          ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (template === 'squared') {
      ctx.strokeStyle = '#d8d8d8'; ctx.lineWidth = 0.3;
      for (let x = 0; x <= w + 1; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h + 1; y += gap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    } else if (template === 'ruled-narrow') {
      const lGap = h / 15, mLeft = w * 0.12, sY = h * 0.08;
      ctx.strokeStyle = '#c4d0e0'; ctx.lineWidth = 0.3;
      for (let y = sY; y < h; y += lGap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = '#ffaaaa'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(mLeft, 0); ctx.lineTo(mLeft, h); ctx.stroke();
    } else if (template === 'cornell') {
      const lGap = h / 15, hdrH = h * 0.1, sumY = h * 0.82, cueX = w * 0.22;
      ctx.strokeStyle = '#c4d0e0'; ctx.lineWidth = 0.3;
      for (let y = hdrH + lGap; y < h; y += lGap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = '#ffaaaa'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, hdrH); ctx.lineTo(w, hdrH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cueX, hdrH); ctx.lineTo(cueX, sumY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, sumY); ctx.lineTo(w, sumY); ctx.stroke();
    } else if (template === 'three-column') {
      const lGap = h / 15, sY = h * 0.08;
      ctx.strokeStyle = '#c4d0e0'; ctx.lineWidth = 0.3;
      for (let y = sY; y < h; y += lGap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = '#ffaaaa'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(w / 3, 0); ctx.lineTo(w / 3, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2 * w / 3, 0); ctx.lineTo(2 * w / 3, h); ctx.stroke();
    }
  }
}
