const PDFDocument = require('pdfkit');
const fs = require('fs');
const logger = require('../utils/logger');

const MM_TO_PT = 72 / 25.4; // 1 mm = ~2.8346 PDF points

const PAGE_SIZES_MM = {
  'a4-landscape':     { widthMm: 297,   heightMm: 210   },
  'a4-portrait':      { widthMm: 210,   heightMm: 297   },
  'letter-landscape': { widthMm: 279.4, heightMm: 215.9 },
  'letter-portrait':  { widthMm: 215.9, heightMm: 279.4 },
  'square':           { widthMm: 210,   heightMm: 210   },
};

class ExportService {
  async exportToPDF(notebook, filePath) {
    const doc    = new PDFDocument({ autoFirstPage: false, margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    for (const page of (notebook.pages || [])) {
      const sizeKey = page.pageSize || 'a4-landscape';
      const sizeMm  = PAGE_SIZES_MM[sizeKey] || PAGE_SIZES_MM['a4-landscape'];
      const w = sizeMm.widthMm  * MM_TO_PT;
      const h = sizeMm.heightMm * MM_TO_PT;

      doc.addPage({ size: [w, h], margin: 0 });
      doc.rect(0, 0, w, h).fill('#ffffff');

      this._renderTemplate(doc, page.template || 'blank', w, h);

      for (const stroke of (page.strokes || [])) {
        this._renderStroke(doc, stroke, w, h);
      }
    }

    doc.end();
    return new Promise((resolve, reject) => {
      stream.on('finish', () => { logger.info('PDF exported:', filePath); resolve(); });
      stream.on('error', reject);
    });
  }

  _renderTemplate(doc, template, w, h) {
    const ppm = MM_TO_PT; // points per mm
    switch (template) {
      case 'dotted':       this._tplDotted(doc, w, h, ppm);       break;
      case 'squared':      this._tplSquared(doc, w, h, ppm);      break;
      case 'ruled-narrow': this._tplRuled(doc, w, h, ppm);        break;
      case 'cornell':      this._tplCornell(doc, w, h, ppm);      break;
      case 'three-column': this._tplThreeColumn(doc, w, h, ppm);  break;
    }
  }

  _tplDotted(doc, w, h, ppm) {
    const gap = 5 * ppm, margin = 8 * ppm;
    doc.fillColor('#c0c0c0');
    for (let y = margin; y < h - margin + 1; y += gap) {
      for (let x = margin; x < w - margin + 1; x += gap) {
        doc.circle(x, y, 0.7).fill();
      }
    }
  }

  _tplSquared(doc, w, h, ppm) {
    const gap = 5 * ppm;
    doc.strokeColor('#d8d8d8').lineWidth(0.3);
    for (let x = 0; x <= w + 1; x += gap) { doc.moveTo(x, 0).lineTo(x, h).stroke(); }
    for (let y = 0; y <= h + 1; y += gap) { doc.moveTo(0, y).lineTo(w, y).stroke(); }
  }

  _tplRuled(doc, w, h, ppm) {
    const lineGap = 7 * ppm, marginLeft = 25 * ppm, startY = 15 * ppm;
    doc.strokeColor('#c4d0e0').lineWidth(0.3);
    for (let y = startY; y < h; y += lineGap) { doc.moveTo(0, y).lineTo(w, y).stroke(); }
    doc.strokeColor('#ffaaaa').lineWidth(0.5);
    doc.moveTo(marginLeft, 0).lineTo(marginLeft, h).stroke();
  }

  _tplCornell(doc, w, h, ppm) {
    const lineGap = 7 * ppm, headerH = 18 * ppm, summaryY = h - 45 * ppm, cueX = 62 * ppm;
    doc.strokeColor('#c4d0e0').lineWidth(0.3);
    for (let y = headerH + lineGap; y < h; y += lineGap) { doc.moveTo(0, y).lineTo(w, y).stroke(); }
    doc.strokeColor('#ffaaaa').lineWidth(0.5);
    doc.moveTo(0, headerH).lineTo(w, headerH).stroke();
    doc.moveTo(cueX, headerH).lineTo(cueX, summaryY).stroke();
    doc.moveTo(0, summaryY).lineTo(w, summaryY).stroke();
  }

  _tplThreeColumn(doc, w, h, ppm) {
    const lineGap = 7 * ppm, startY = 15 * ppm, col1 = w / 3, col2 = 2 * w / 3;
    doc.strokeColor('#c4d0e0').lineWidth(0.3);
    for (let y = startY; y < h; y += lineGap) { doc.moveTo(0, y).lineTo(w, y).stroke(); }
    doc.strokeColor('#ffaaaa').lineWidth(0.5);
    doc.moveTo(col1, 0).lineTo(col1, h).stroke();
    doc.moveTo(col2, 0).lineTo(col2, h).stroke();
  }

  _renderStroke(doc, stroke, w, h) {
    const pts = stroke.points;
    if (!pts || pts.length < 2) return;
    const avgPressure = pts.reduce((s, p) => s + (p.pressure || 0.5), 0) / pts.length;
    const lineWidth   = Math.max(0.5, (stroke.width || 2) * avgPressure);
    doc.moveTo(pts[0].x * w, pts[0].y * h);
    for (let i = 1; i < pts.length; i++) { doc.lineTo(pts[i].x * w, pts[i].y * h); }
    doc.strokeColor(stroke.color || '#000000')
       .lineWidth(lineWidth)
       .lineCap('round')
       .lineJoin('round')
       .stroke();
  }
}

module.exports = ExportService;
