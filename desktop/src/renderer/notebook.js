class NotebookManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.notebook = null;
    this.currentPageIndex = 0;
    this.onPageChange = null; // callback(currentIndex, pageCount)
  }

  loadNotebook(notebook) {
    this.notebook = notebook;
    this.currentPageIndex = 0;
    const page = notebook.pages && notebook.pages[0];
    this.renderer.setPageConfig(
      page ? (page.pageSize || DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
      page ? (page.template || DEFAULT_TEMPLATE)  : DEFAULT_TEMPLATE,
    );
    this.renderer.importPageData(page ? (page.strokes || []) : []);
    this._notify();
  }

  get pageCount() {
    return this.notebook ? this.notebook.pages.length : 0;
  }

  getCurrentPage() {
    if (!this.notebook) return null;
    return this.notebook.pages[this.currentPageIndex];
  }

  switchToPage(index) {
    if (!this.notebook) return;
    if (index < 0 || index >= this.notebook.pages.length) return;
    if (index === this.currentPageIndex) return;

    this._saveCurrentPage();
    this.currentPageIndex = index;
    const page = this.getCurrentPage();
    this.renderer.setPageConfig(
      page.pageSize || DEFAULT_PAGE_SIZE,
      page.template || DEFAULT_TEMPLATE,
    );
    this.renderer.importPageData(page.strokes || []);
    this._notify();
  }

  // pageSize and template default to current page's values so iPad-triggered adds are seamless
  addPage({ pageSize, template } = {}) {
    if (!this.notebook) return;
    this._saveCurrentPage();

    const currentPage = this.getCurrentPage();
    const resolvedSize = pageSize || (currentPage && currentPage.pageSize) || DEFAULT_PAGE_SIZE;
    const resolvedTpl  = template || (currentPage && currentPage.template) || DEFAULT_TEMPLATE;

    const newPage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      index: this.notebook.pages.length,
      strokes: [],
      pageSize: resolvedSize,
      template: resolvedTpl,
    };
    this.notebook.pages.push(newPage);
    this.currentPageIndex = this.notebook.pages.length - 1;
    this.renderer.setPageConfig(resolvedSize, resolvedTpl);
    this.renderer.importPageData([]);
    this._notify();
  }

  deletePage(index) {
    if (!this.notebook || this.notebook.pages.length <= 1) return;

    this._saveCurrentPage();
    this.notebook.pages.splice(index, 1);
    this.notebook.pages.forEach((p, i) => { p.index = i; });

    if (index < this.currentPageIndex) {
      this.currentPageIndex--;
    } else if (this.currentPageIndex >= this.notebook.pages.length) {
      this.currentPageIndex = this.notebook.pages.length - 1;
    }
    const page = this.getCurrentPage();
    this.renderer.setPageConfig(
      page.pageSize || DEFAULT_PAGE_SIZE,
      page.template || DEFAULT_TEMPLATE,
    );
    this.renderer.importPageData(page.strokes || []);
    this._notify();
  }

  // Insert a copy of pageData after the given index (does not switch to it)
  insertPage(afterIndex, pageData) {
    if (!this.notebook) return;
    this._saveCurrentPage();

    const insertAt = afterIndex + 1;
    const newPage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      index: insertAt,
      strokes: JSON.parse(JSON.stringify(pageData.strokes || [])),
      pageSize: pageData.pageSize || DEFAULT_PAGE_SIZE,
      template: pageData.template || DEFAULT_TEMPLATE,
    };
    this.notebook.pages.splice(insertAt, 0, newPage);
    this.notebook.pages.forEach((p, i) => { p.index = i; });

    if (insertAt <= this.currentPageIndex) {
      this.currentPageIndex++;
    }
    this._notify();
  }

  getExportData() {
    this._saveCurrentPage();
    return this.notebook;
  }

  _saveCurrentPage() {
    const page = this.getCurrentPage();
    if (page) page.strokes = this.renderer.exportPageData();
  }

  _notify() {
    if (this.onPageChange) this.onPageChange(this.currentPageIndex, this.pageCount);
  }
}
