// PageSetupUI — modal for choosing page size + template when creating a notebook or adding a page.
// PAGE_SIZES, DEFAULT_PAGE_SIZE, DEFAULT_TEMPLATE are defined in canvas.js (loaded first).
class PageSetupUI {
  constructor() {
    this.overlay = document.getElementById('page-setup-overlay');
    this._mode = 'notebook';
    this._onConfirm = null;
    this._onCancel  = null;

    document.getElementById('page-setup-close-btn').addEventListener('click', () => this._cancel());
    document.getElementById('page-setup-cancel').addEventListener('click',    () => this._cancel());
    document.getElementById('page-setup-confirm').addEventListener('click',   () => this._confirm());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this._cancel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) this._cancel();
    });
    document.getElementById('page-setup-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._confirm();
    });

    document.querySelectorAll('.ps-size-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ps-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    document.querySelectorAll('.ps-template-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ps-template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  show({ mode = 'notebook', defaults = {}, onConfirm, onCancel } = {}) {
    this._mode = mode;
    this._onConfirm = onConfirm;
    this._onCancel  = onCancel;

    const nameRow   = document.getElementById('page-setup-name-row');
    const nameInput = document.getElementById('page-setup-name');
    if (mode === 'notebook') {
      nameRow.classList.remove('nb-hidden');
      nameInput.value = defaults.name || '';
      setTimeout(() => nameInput.focus(), 50);
    } else {
      nameRow.classList.add('nb-hidden');
    }

    document.getElementById('page-setup-title').textContent =
      mode === 'notebook' ? 'New Notebook' : 'Add Page';
    document.getElementById('page-setup-confirm').textContent =
      mode === 'notebook' ? 'Create' : 'Add Page';

    const defSize = defaults.pageSize || DEFAULT_PAGE_SIZE;
    document.querySelectorAll('.ps-size-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === defSize);
    });

    const defTpl = defaults.template || DEFAULT_TEMPLATE;
    document.querySelectorAll('.ps-template-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.template === defTpl);
    });

    this.overlay.classList.remove('hidden');
  }

  close() { this.overlay.classList.add('hidden'); }

  _getSelected() {
    const sizeBtn = document.querySelector('.ps-size-btn.active');
    const tplBtn  = document.querySelector('.ps-template-btn.active');
    return {
      pageSize: sizeBtn ? sizeBtn.dataset.size     : DEFAULT_PAGE_SIZE,
      template: tplBtn  ? tplBtn.dataset.template  : DEFAULT_TEMPLATE,
    };
  }

  _confirm() {
    const { pageSize, template } = this._getSelected();
    if (this._mode === 'notebook') {
      const nameInput = document.getElementById('page-setup-name');
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      if (this._onConfirm) this._onConfirm({ name, pageSize, template });
    } else {
      if (this._onConfirm) this._onConfirm({ pageSize, template });
    }
    this.close();
  }

  _cancel() {
    this.close();
    if (this._onCancel) this._onCancel();
  }
}
