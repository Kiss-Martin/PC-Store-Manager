import PDFDocument from 'pdfkit';

function toDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
}

function drawTable(doc, columns, rows, startY) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = pageWidth / columns.length;
  const cellPadding = 6;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  let y = startY;

  const drawHeader = () => {
    const headerHeight = 24;

    if (y + headerHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    doc.save();
    doc.rect(doc.page.margins.left, y, pageWidth, headerHeight).fill('#7c3aed');
    doc.restore();

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    columns.forEach((column, index) => {
      const x = doc.page.margins.left + index * columnWidth;
      doc.text(column.label, x + cellPadding, y + 7, {
        width: columnWidth - cellPadding * 2,
        ellipsis: true,
      });
    });

    y += headerHeight;
  };

  drawHeader();

  rows.forEach((row, rowIndex) => {
    const cellHeights = columns.map((column) =>
      doc.heightOfString(toDisplayValue(row[column.key]), {
        width: columnWidth - cellPadding * 2,
        align: 'left',
      })
    );
    const rowHeight = Math.max(22, ...cellHeights.map((height) => height + cellPadding * 2));

    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    if (rowIndex % 2 === 0) {
      doc.save();
      doc.rect(doc.page.margins.left, y, pageWidth, rowHeight).fill('#f8f5ff');
      doc.restore();
    }

    doc.fillColor('#1f2937').font('Helvetica').fontSize(9);
    columns.forEach((column, index) => {
      const x = doc.page.margins.left + index * columnWidth;
      doc.text(toDisplayValue(row[column.key]), x + cellPadding, y + cellPadding, {
        width: columnWidth - cellPadding * 2,
        align: 'left',
      });
    });

    doc.save();
    doc.moveTo(doc.page.margins.left, y + rowHeight)
      .lineTo(doc.page.margins.left + pageWidth, y + rowHeight)
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .stroke();
    doc.restore();

    y += rowHeight;
  });
}

export function generatePdfReport({ title, subtitle, summary = [], columns = [], rows = [] }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      info: {
        Title: title,
      },
    });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#111827').text(title);

    if (subtitle) {
      doc.moveDown(0.35);
      doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(subtitle);
    }

    if (summary.length > 0) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Summary');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10).fillColor('#374151');
      summary.forEach((item) => {
        doc.text(`${item.label}: ${toDisplayValue(item.value)}`);
      });
    }

    doc.moveDown(1);
    drawTable(doc, columns, rows, doc.y);
    doc.end();
  });
}