const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.basePath = path.join(app.getPath('userData'), 'notebooks');
    this._ensureDirectories();
  }

  _ensureDirectories() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      logger.info('Created notebooks directory:', this.basePath);
    }
  }

  async saveNotebook(notebook) {
    const filePath = path.join(this.basePath, `${notebook.id}.json`);
    notebook.updatedAt = new Date().toISOString();
    const data = JSON.stringify(notebook, null, 2);
    await fs.promises.writeFile(filePath, data, 'utf-8');
    logger.debug('Notebook saved:', notebook.id);
  }

  async loadNotebook(id) {
    const filePath = path.join(this.basePath, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async listNotebooks() {
    const files = await fs.promises.readdir(this.basePath);
    const notebooks = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const filePath = path.join(this.basePath, file);
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const nb = JSON.parse(data);
        notebooks.push({
          id: nb.id,
          name: nb.name,
          pageCount: nb.pages ? nb.pages.length : 0,
          updatedAt: nb.updatedAt,
          createdAt: nb.createdAt,
        });
      } catch (err) {
        logger.error('Failed to read notebook:', file, err.message);
      }
    }
    notebooks.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return notebooks;
  }

  async deleteNotebook(id) {
    const filePath = path.join(this.basePath, `${id}.json`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info('Notebook deleted:', id);
    }
  }

  async renameNotebook(id, newName) {
    const notebook = await this.loadNotebook(id);
    if (notebook) {
      notebook.name = newName;
      await this.saveNotebook(notebook);
    }
  }

  // Create a new empty notebook and return it
  createNotebook(name = 'Untitled', pageSize = 'a4-landscape', template = 'blank') {
    const id = this._generateId();
    const now = new Date().toISOString();
    return {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      pages: [
        {
          id: this._generateId(),
          index: 0,
          strokes: [],
          pageSize,
          template,
        },
      ],
    };
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

module.exports = StorageService;
