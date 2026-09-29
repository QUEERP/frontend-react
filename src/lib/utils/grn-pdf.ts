import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportGRNToPDF = (grn: any, businessName: string = 'Our Business') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Title & Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GOODS RECEIVE NOTE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`GRN Number: ${grn.grnNumber}`, 14, 35);
  doc.text(`Received Date: ${new Date(grn.receivedDate).toLocaleDateString()}`, 14, 42);
  if (grn.purchaseOrder) {
    doc.text(`PO Number: ${grn.purchaseOrder.poNumber}`, 14, 49);
  }
  doc.text(`Status: ${grn.status}`, 14, 56);

  // Vendor Info
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor Details:', 120, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${grn.vendor?.name || '—'}`, 120, 42);
  if (grn.warehouse?.name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Warehouse:', 120, 49);
    doc.setFont('helvetica', 'normal');
    doc.text(grn.warehouse.name, 120, 56);
  }

  // Table
  const tableData = (grn.items || []).map((item: any, index: number) => [
    index + 1,
    item.product?.name || `Product ID: ${item.productId}`,
    item.quantityOrdered || '—',
    item.quantityReceived || 0,
    item.quantityDamaged || 0,
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Description', 'Ordered', 'Received', 'Damaged']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Notes
  if (grn.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(grn.notes, pageWidth - 28);
    doc.text(splitNotes, 14, finalY + 7);
  }

  doc.save(`GRN-${grn.grnNumber}.pdf`);
};
