import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPdf = (
  title: string,
  columns: string[],
  data: any[][],
  filename: string
) => {
  const doc = new jsPDF('landscape');
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: data,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] }
  });

  doc.save(`${filename}.pdf`);
};

export const printPage = () => {
  window.print();
};

// ─── Status color helper ────────────────────────────────────────────────────
const statusColor = (status: string): [number, number, number] => {
  if (status === 'PAID') return [16, 185, 129];       // emerald
  if (status === 'UNPAID') return [239, 68, 68];      // red
  if (status.includes('PARTIAL')) return [245, 158, 11]; // amber
  return [100, 116, 139];                              // slate
};

// ─── Shared PDF header banner ────────────────────────────────────────────────
const drawHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
  accent: [number, number, number],
  pageWidth: number
) => {
  // Dark top bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent stripe
  doc.setFillColor(...accent);
  doc.rect(0, 28, pageWidth, 4, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 18);

  // Subtitle top-right
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(subtitle, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-AE')}`, pageWidth - 14, 20, { align: 'right' });
};

// ─── Shared PDF footer ───────────────────────────────────────────────────────
const drawFooter = (doc: jsPDF, pageWidth: number) => {
  const y = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, y - 4, pageWidth - 14, y - 4);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('QUE ERP — UAE Tax Engine', 14, y);
  doc.text('CONFIDENTIAL', pageWidth / 2, y, { align: 'center' });
  doc.text('Page 1 of 1', pageWidth - 14, y, { align: 'right' });
};

// ─── Summary KPI boxes ────────────────────────────────────────────────────────
const drawSummaryBox = (
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  accent: [number, number, number]
) => {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // left accent bar
  doc.setFillColor(...accent);
  doc.roundedRect(x, y, 3, h, 1, 1, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(label, x + 7, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(value, x + 7, y + 16);
};

// ─── Sales Register PDF ──────────────────────────────────────────────────────
export const exportSalesRegisterPdf = (
  rows: {
    id: string; date: string; customer: string; trn: string;
    country: string; currency: string; subtotal: number;
    vatPct: number; vatAmt: number; total: number; status: string;
  }[],
  period: string
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const accent: [number, number, number] = [99, 102, 241]; // indigo

  drawHeader(doc, 'Sales Register', `Period: ${period}  |  UAE VAT`, accent, pw);

  // Summary KPI row
  const totalSubtotal = rows.reduce((s, r) => s + r.subtotal, 0);
  const totalVat = rows.reduce((s, r) => s + r.vatAmt, 0);
  const totalGrand = rows.reduce((s, r) => s + r.total, 0);
  const fmt = (n: number) => `AED ${n.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`;

  const boxW = (pw - 28 - 12) / 4;
  drawSummaryBox(doc, 14,        36, boxW, 22, 'Total Invoices', `${rows.length}`,         [99, 102, 241]);
  drawSummaryBox(doc, 14+boxW+4, 36, boxW, 22, 'Total Subtotal', fmt(totalSubtotal),        [59, 130, 246]);
  drawSummaryBox(doc, 14+boxW*2+8,36, boxW, 22,'Output VAT',     fmt(totalVat),             [245, 158, 11]);
  drawSummaryBox(doc, 14+boxW*3+12,36,boxW,22, 'Grand Total',    fmt(totalGrand),           [16, 185, 129]);

  autoTable(doc, {
    startY: 62,
    head: [['Invoice #', 'Date', 'Customer', 'TRN', 'Country', 'Cur.', 'Subtotal', 'VAT %', 'VAT Amt', 'Grand Total', 'Status']],
    body: rows.map(r => [
      r.id, r.date, r.customer, r.trn, r.country, r.currency,
      r.subtotal.toLocaleString(), `${r.vatPct}%`,
      r.vatAmt.toLocaleString(), r.total.toLocaleString(), r.status.replace('_', ' ')
    ]),
    foot: [['', '', '', '', '', 'TOTAL',
      totalSubtotal.toLocaleString(), '',
      totalVat.toLocaleString(), totalGrand.toLocaleString(), '']],
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [15, 23, 42], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 8
    },
    footStyles: {
      fillColor: [241, 245, 249], textColor: [15, 23, 42],
      fontStyle: 'bold', fontSize: 8
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: accent },
      5: { halign: 'center' },
      6: { halign: 'right' },
      7: { halign: 'center' },
      8: { halign: 'right', textColor: [245, 158, 11] },
      9: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 10) {
        const val = String(data.cell.raw ?? '');
        const [r, g, b] = statusColor(val.replace(' ', '_'));
        data.cell.styles.textColor = [r, g, b];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  drawFooter(doc, pw);
  doc.save('Sales_Register.pdf');
};

// ─── Purchase Register PDF ───────────────────────────────────────────────────
export const exportPurchaseRegisterPdf = (
  rows: {
    id: string; date: string; vendor: string; trn: string;
    country: string; subtotal: number;
    vatPct: number; vatAmt: number; total: number; status: string;
  }[],
  period: string
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const accent: [number, number, number] = [16, 185, 129]; // emerald

  drawHeader(doc, 'Purchase Register', `Period: ${period}  |  UAE VAT`, accent, pw);

  const totalSubtotal = rows.reduce((s, r) => s + r.subtotal, 0);
  const totalVat = rows.reduce((s, r) => s + r.vatAmt, 0);
  const totalGrand = rows.reduce((s, r) => s + r.total, 0);
  const fmt = (n: number) => `AED ${n.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`;

  const boxW = (pw - 28 - 12) / 4;
  drawSummaryBox(doc, 14,         36, boxW, 22, 'Total Bills',    `${rows.length}`,         [16, 185, 129]);
  drawSummaryBox(doc, 14+boxW+4,  36, boxW, 22, 'Total Subtotal', fmt(totalSubtotal),        [59, 130, 246]);
  drawSummaryBox(doc, 14+boxW*2+8,36, boxW, 22, 'Input VAT',      fmt(totalVat),             [245, 158, 11]);
  drawSummaryBox(doc, 14+boxW*3+12,36,boxW, 22, 'Grand Total',    fmt(totalGrand),           [99, 102, 241]);

  autoTable(doc, {
    startY: 62,
    head: [['Bill #', 'Date', 'Vendor', 'TRN', 'Country', 'Subtotal', 'VAT %', 'VAT Amt', 'Grand Total', 'Status']],
    body: rows.map(r => [
      r.id, r.date, r.vendor, r.trn, r.country,
      r.subtotal.toLocaleString(), `${r.vatPct}%`,
      r.vatAmt.toLocaleString(), r.total.toLocaleString(), r.status.replace('_', ' ')
    ]),
    foot: [['', '', '', '', 'TOTAL',
      totalSubtotal.toLocaleString(), '',
      totalVat.toLocaleString(), totalGrand.toLocaleString(), '']],
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [15, 23, 42], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 8
    },
    footStyles: {
      fillColor: [241, 245, 249], textColor: [15, 23, 42],
      fontStyle: 'bold', fontSize: 8
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: accent },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'right', textColor: [245, 158, 11] },
      8: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 9) {
        const val = String(data.cell.raw ?? '');
        const [r, g, b] = statusColor(val.replace(' ', '_'));
        data.cell.styles.textColor = [r, g, b];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 }
  });

  drawFooter(doc, pw);
  doc.save('Purchase_Register.pdf');
};
