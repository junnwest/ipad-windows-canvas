class NotebookListUI {
  constructor() {
    this.overlay = document.getElementById('notebook-modal-overlay');
    this.listEl  = document.getElementById('notebook-list-grid');
    this._currentId = null;

    this.onNewClick = null;  // callback: () => void — opens PageSetupUI
    this.onOpen   = null;    // callback: (id) => void
    this.onRename = null;    // callback: (id, newName) => void
    this.onDelete = null;    // callback: (id) => void

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
  }

  close() { this.overlay.classList.add('hidden'); }

  render(notebooks) {
    this.listEl.innerHTML = '';
    if (!notebooks || notebooks.length === 0) {
      this.listEl.innerHTML = '<p class="notebook-empty">No notebooks yet. Create one to get started.</p>';
      return;
    }
    notebooks.forEach((nb) => this.listEl.appendChild(this._createCard(nb)));
  }

  _createCard(nb) {
    const isCurrent  = nb.id === this._currentId;
    const pageText   = nb.pageCount === 1 ? '1 page' : `${nb.pageCount} pages`;
    const updatedDate = nb.updatedAt ? new Date(nb.updatedAt).toLocaleDateString() : '';

    const card = document.createElement('div');
    card.className = 'notebook-card' + (isCurrent ? ' current' : '');
    card.dataset.id = nb.id;

    // Header row
    const header = document.createElement('div');
    header.className = 'notebook-card-header';
    const nameEl = document.createElement('div');
    nameEl.className = 'notebook-card-name';
    nameEl.textContent = nb.name;
    header.appendChild(nameEl);
    if (isCurrent) {
      const badge = document.createElement('span');
      badge.className = 'notebook-current-badge';
      badge.textContent = 'Open';
      header.appendChild(badge);
    }

    // Inline rename input (hidden by default)
    const renameInput = document.createElement('input');
    renameInput.type = 'text';
    renameInput.className = 'notebook-rename-input nb-hidden';
    renameInput.value = nb.name;

    // Meta line
    const meta = document.createElement('div');
    meta.className = 'notebook-card-meta';
    meta.textContent = `${pageText} · ${updatedDate}`;

    // Normal actions
    const normalActions = document.createElement('div');
    normalActions.className = 'notebook-card-actions';
    const renameBtn = document.createElement('button');
    renameBtn.className = 'notebook-card-btn rename-btn';
    renameBtn.textContent = 'Rename';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'notebook-card-btn delete-btn';
    deleteBtn.textContent = 'Delete';
    normalActions.appendChild(renameBtn);
    normalActions.appendChild(deleteBtn);

    // Delete confirm actions (hidden by default)
    const confirmActions = document.createElement('div');
    confirmActions.className = 'notebook-card-actions nb-hidden';
    const confirmText = document.createElement('span');
    confirmText.className = 'delete-confirm-text';
    confirmText.textContent = 'Delete?';
    const yesBtn = document.createElement('button');
    yesBtn.className = 'notebook-card-btn yes-btn';
    yesBtn.textContent = 'Yes';
    const noBtn = document.createElement('button');
    noBtn.className = 'notebook-card-btn no-btn';
    noBtn.textContent = 'No';
    confirmActions.appendChild(confirmText);
    confirmActions.appendChild(yesBtn);
    confirmActions.appendChild(noBtn);

    card.appendChild(header);
    card.appendChild(renameInput);
    card.appendChild(meta);
    card.appendChild(normalActions);
    card.appendChild(confirmActions);

    // Open on card click (not buttons/inputs)
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button') && !e.target.closest('input')) {
        if (this.onOpen) this.onOpen(nb.id);
      }
    });

    // Rename: toggle input
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      header.classList.add('nb-hidden');
      renameInput.classList.remove('nb-hidden');
      renameInput.value = nb.name;
      renameInput.focus();
      renameInput.select();
    });

    const commitRename = () => {
      const newName = renameInput.value.trim();
      renameInput.classList.add('nb-hidden');
      header.classList.remove('nb-hidden');
      if (newName && newName !== nb.name && this.onRename) {
        this.onRename(nb.id, newName);
      }
    };
    renameInput.addEventListener('blur', commitRename);
    renameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); renameInput.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); renameInput.value = nb.name; renameInput.blur(); }
    });

    // Delete: show confirm row
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

    return card;
  }
}
