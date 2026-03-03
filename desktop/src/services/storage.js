'use strict';

const path     = require('path');
const fs       = require('fs');
const { app }  = require('electron');
const Database = require('better-sqlite3');
const logger   = require('../utils/logger');

// Legacy JSON directory (kept for one-time migration on first run)
const legacyDir = () => path.join(app.getPath('userData'), 'notebooks');
const dbPath    = () => path.join(app.getPath('userData'), 'notebridge.db');

class StorageService {
  constructor() {
    this._db = new Database(dbPath());
    this._db.pragma('journal_mode = WAL'); // safe concurrent access + faster writes
    this._db.pragma('foreign_keys = ON');
    this._createSchema();
    this._migrateFromJSON();
  }

  // ---- Schema ----------------------------------------------------------------

  _createSchema() {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS notebooks (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pages (
        id          TEXT PRIMARY KEY,
        notebook_id TEXT NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
        idx         INTEGER NOT NULL,
        page_size   TEXT NOT NULL DEFAULT 'a4-landscape',
        template    TEXT NOT NULL DEFAULT 'blank',
        strokes     TEXT NOT NULL DEFAULT '[]',
        texts       TEXT NOT NULL DEFAULT '[]'
      );

      CREATE INDEX IF NOT EXISTS pages_by_notebook ON pages(notebook_id, idx);
    `);
  }

  // ---- One-time JSON → SQLite migration -------------------------------------

  _migrateFromJSON() {
    const dir = legacyDir();
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    if (!files.length) return;

    const known = new Set(
      this._db.prepare('SELECT id FROM notebooks').all().map(r => r.id)
    );

    for (const file of files) {
      try {
        const nb = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        if (!nb.id || known.has(nb.id)) continue;
        this._writeNotebook(nb);
        logger.info('Migrated notebook from JSON:', nb.name, `(${nb.id})`);
      } catch (err) {
        logger.error('Failed to migrate notebook file:', file, err.message);
      }
    }
  }

  // ---- Internal write (synchronous, wrapped in transaction) -----------------

  _writeNotebook(notebook) {
    const upsertNb   = this._db.prepare(`
      INSERT OR REPLACE INTO notebooks (id, name, created_at, updated_at)
      VALUES (@id, @name, @createdAt, @updatedAt)
    `);
    const deletePgs  = this._db.prepare('DELETE FROM pages WHERE notebook_id = ?');
    const insertPage = this._db.prepare(`
      INSERT INTO pages (id, notebook_id, idx, page_size, template, strokes, texts)
      VALUES (@id, @notebookId, @idx, @pageSize, @template, @strokes, @texts)
    `);

    this._db.transaction(() => {
      upsertNb.run({
        id:        notebook.id,
        name:      notebook.name,
        createdAt: notebook.createdAt || new Date().toISOString(),
        updatedAt: notebook.updatedAt || new Date().toISOString(),
      });

      deletePgs.run(notebook.id);

      for (const page of (notebook.pages || [])) {
        insertPage.run({
          id:         page.id,
          notebookId: notebook.id,
          idx:        page.index ?? 0,
          pageSize:   page.pageSize || 'a4-landscape',
          template:   page.template || 'blank',
          strokes:    JSON.stringify(page.strokes || []),
          texts:      JSON.stringify(page.texts   || []),
        });
      }
    })();
  }

  // ---- Row → domain object helpers ------------------------------------------

  _pageFromRow(row) {
    return {
      id:       row.id,
      index:    row.idx,
      pageSize: row.page_size,
      template: row.template,
      strokes:  JSON.parse(row.strokes),
      texts:    JSON.parse(row.texts),
    };
  }

  _notebookFromRows(nbRow, pageRows) {
    return {
      id:        nbRow.id,
      name:      nbRow.name,
      createdAt: nbRow.created_at,
      updatedAt: nbRow.updated_at,
      pages:     pageRows.map(r => this._pageFromRow(r)),
    };
  }

  // ---- Public API (async-compatible, matches original JSON-file interface) --

  async saveNotebook(notebook) {
    notebook.updatedAt = new Date().toISOString();
    this._writeNotebook(notebook);
    logger.debug('Notebook saved:', notebook.id);
  }

  async loadNotebook(id) {
    const nbRow = this._db.prepare('SELECT * FROM notebooks WHERE id = ?').get(id);
    if (!nbRow) return null;
    const pageRows = this._db
      .prepare('SELECT * FROM pages WHERE notebook_id = ? ORDER BY idx')
      .all(id);
    return this._notebookFromRows(nbRow, pageRows);
  }

  async listNotebooks() {
    const rows = this._db.prepare(`
      SELECT n.id, n.name, n.created_at, n.updated_at,
             COUNT(p.id) AS page_count
      FROM   notebooks n
      LEFT JOIN pages p ON p.notebook_id = n.id
      GROUP  BY n.id
      ORDER  BY n.updated_at DESC
    `).all();
    return rows.map(r => ({
      id:        r.id,
      name:      r.name,
      pageCount: r.page_count,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async deleteNotebook(id) {
    // CASCADE on the pages FK handles page deletion
    this._db.prepare('DELETE FROM notebooks WHERE id = ?').run(id);
    logger.info('Notebook deleted:', id);
  }

  async renameNotebook(id, newName) {
    this._db
      .prepare('UPDATE notebooks SET name = ?, updated_at = ? WHERE id = ?')
      .run(newName, new Date().toISOString(), id);
  }

  createNotebook(name = 'Untitled', pageSize = 'a4-landscape', template = 'blank') {
    const id  = this._generateId();
    const now = new Date().toISOString();
    return {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      pages: [{
        id:       this._generateId(),
        index:    0,
        strokes:  [],
        texts:    [],
        pageSize,
        template,
      }],
    };
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

module.exports = StorageService;
