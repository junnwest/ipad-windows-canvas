const NB_COVERS = [
  'linear-gradient(150deg,#547088 0%,#3e5870 100%)',
  'linear-gradient(150deg,#6a8a70 0%,#507860 100%)',
  'linear-gradient(150deg,#7a6070 0%,#624855 100%)',
  'linear-gradient(150deg,#c07850 0%,#9e5e38 100%)',
  'linear-gradient(150deg,#384858 0%,#263445 100%)',
  'linear-gradient(150deg,#6a6250 0%,#58503e 100%)',
];
const ACCENT = '#c07850';

class NotebookListUI {
  constructor() {
    this.overlay = document.getElementById('notebook-modal-overlay');
    this.listEl  = document.getElementById('notebook-list-grid');
    this._currentId = null;

    this.onNewClick = null;
    this.onOpen   = null;
    this.onRename = null;
    this.onDelete = null;

    document.getElementById('notebook-new-btn').addEventListener('click', () => {
      if (this.onNewClick) this.onNewClick();
    });
    document.getElementById('notebook-modal-close').addEventListener('click', () => this.close());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) this.close();
    });
  }

  open(notebooks, currentId) {
    this._currentId = currentId || null;
    this.render(notebooks);
    this.overlay.classList.remove('hidden');
    // update status bar count
    const countEl = document.getElementById('nb-count');
    if (countEl) countEl.textContent = notebooks && notebooks.length
      ? `${notebooks.length} notebook${notebooks.length !== 1 ? 's' : ''}`
      : '—';
  }

  close() { this.overlay.classList.add('hidden'); }

  render(notebooks) {
    this.listEl.innerHTML = '';
    if (!notebooks || notebooks.length === 0) {
      this.listEl.innerHTML = '<p class="notebook-empty">No notebooks yet. Create one to get started.</p>';
      return;
    }
    notebooks.forEach((nb, i) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'contents';
      const card = this._createCard(nb, i);
      this.listEl.appendChild(card);
    });
    // placeholder "new" cell
    const placeholder = this._createPlaceholder();
    this.listEl.appendChild(placeholder);
  }

  _createCard(nb, index) {
    const isCurrent  = nb.id === this._currentId;
    const pageText   = nb.pageCount === 1 ? '1 page' : `${nb.pageCount} pages`;
    const updatedDate = nb.updatedAt ? new Date(nb.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const coverIdx   = index % NB_COVERS.length;
    const spineColor = coverIdx === 3 ? 'rgba(255,255,255,0.28)' : ACCENT;

    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';

    // ── Card ──
    const card = document.createElement('div');
    card.className = 'notebook-card' + (isCurrent ? ' current' : '');
    card.dataset.id = nb.id;

    // Cover area
    const cover = document.createElement('div');
    cover.className = 'notebook-cover';
    cover.style.background = NB_COVERS[coverIdx];

    const highlight = document.createElement('div');
    highlight.className = 'notebook-cover-highlight';
    const spine = document.createElement('div');
    spine.className = 'notebook-cover-spine';
    spine.style.background = spineColor;
    const shadow = document.createElement('div');
    shadow.className = 'notebook-cover-shadow';

    cover.appendChild(highlight);
    cover.appendChild(spine);
    cover.appendChild(shadow);

    // Metadata area
    const meta = document.createElement('div');
    meta.className = 'notebook-meta';

    const nameRow = document.createElement('div');
    nameRow.style.display = 'flex';
    nameRow.style.alignItems = 'center';

    const nameEl = document.createElement('div');
    nameEl.className = 'notebook-meta-name';
    nameEl.textContent = nb.name;
    nameRow.appendChild(nameEl);
    if (isCurrent) {
      const badge = document.createElement('span');
      badge.className = 'notebook-current-badge';
      badge.textContent = 'Open';
      nameRow.appendChild(badge);
    }

    const renameInput = document.createElement('input');
    renameInput.type = 'text';
    renameInput.className = 'notebook-rename-input nb-hidden';
    renameInput.value = nb.name;

    const pagesEl = document.createElement('div');
    pagesEl.className = 'notebook-meta-pages';
    pagesEl.textContent = pageText;

    const dateEl = document.createElement('div');
    dateEl.className = 'notebook-meta-date';
    dateEl.textContent = updatedDate;

    meta.appendChild(nameRow);
    meta.appendChild(renameInput);
    meta.appendChild(pagesEl);
    meta.appendChild(dateEl);

    card.appendChild(cover);
    card.appendChild(meta);

    // Open card on click (not button clicks)
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button') && !e.target.closest('input')) {
        if (this.onOpen) this.onOpen(nb.id);
      }
    });

    // ── Action buttons row (below the card) ──
    const normalActions = document.createElement('div');
    normalActions.className = 'notebook-card-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'win-btn win-btn-sm win-btn-accent';
    openBtn.style.width = '52px';
    openBtn.textContent = 'Open';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'win-btn win-btn-sm';
    renameBtn.textContent = 'Rename';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'win-btn win-btn-sm notebook-delete-btn';
    deleteBtn.textContent = 'Delete';

    normalActions.appendChild(openBtn);
    normalActions.appendChild(renameBtn);
    normalActions.appendChild(deleteBtn);

    // Delete confirm row
    const confirmActions = document.createElement('div');
    confirmActions.className = 'notebook-card-actions nb-hidden';
    const confirmText = document.createElement('span');
    confirmText.className = 'delete-confirm-text';
    confirmText.textContent = 'Delete?';
    const yesBtn = document.createElement('button');
    yesBtn.className = 'win-btn win-btn-sm notebook-delete-btn';
    yesBtn.textContent = 'Yes';
    const noBtn = document.createElement('button');
    noBtn.className = 'win-btn win-btn-sm';
    noBtn.textContent = 'No';
    confirmActions.appendChild(confirmText);
    confirmActions.appendChild(yesBtn);
    confirmActions.appendChild(noBtn);

    wrap.appendChild(card);
    wrap.appendChild(normalActions);
    wrap.appendChild(confirmActions);

    // Open
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onOpen) this.onOpen(nb.id);
    });

    // Rename toggle
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nameRow.classList.add('nb-hidden');
      renameInput.classList.remove('nb-hidden');
      renameInput.value = nb.name;
      renameInput.focus();
      renameInput.select();
    });

    const commitRename = () => {
      const newName = renameInput.value.trim();
      renameInput.classList.add('nb-hidden');
      nameRow.classList.remove('nb-hidden');
      if (newName && newName !== nb.name && this.onRename) {
        this.onRename(nb.id, newName);
      }
    };
    renameInput.addEventListener('blur', commitRename);
    renameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); renameInput.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); renameInput.value = nb.name; renameInput.blur(); }
    });

    // Delete confirm
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      normalActions.classList.add('nb-hidden');
      confirmActions.classList.remove('nb-hidden');
    });
    yesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onDelete) this.onDelete(nb.id);
    });
    noBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmActions.classList.add('nb-hidden');
      normalActions.classList.remove('nb-hidden');
    });

    return wrap;
  }

  _createPlaceholder() {
    const el = document.createElement('div');
    el.className = 'notebook-new-placeholder';
    el.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:var(--wPanel);
        display:flex;align-items:center;justify-content:center;color:var(--wFgDim)">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M9 4v10M4 9h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <span style="font-family:var(--win-font);font-size:12px;color:var(--wFgDim)">New Notebook</span>
    `;
    el.addEventListener('click', () => {
      if (this.onNewClick) this.onNewClick();
    });
    return el;
  }
}
