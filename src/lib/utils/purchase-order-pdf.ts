import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportPurchaseOrderToPDF = (order: any, businessName: string = 'Our Business') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Title & Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`PO Number: ${order.poNumber}`, 14, 35);
  doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 14, 42);
  if (order.expectedDeliveryDate) {
    doc.text(`Expected Delivery: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}`, 14, 49);
  }
  doc.text(`Status: ${order.status}`, 14, 56);

  // Vendor Info
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor Details:', 120, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.vendor?.name || '—'}`, 120, 42);
  if (order.vendor?.email) doc.text(`Email: ${order.vendor.email}`, 120, 49);
  if (order.vendor?.phone) doc.text(`Phone: ${order.vendor.phone}`, 120, 56);

  // Table
  const tableData = (order.items || []).map((item: any, index: number) => [
    index + 1,
    item.product?.name || item.description || 'Item',
    item.quantity,
    `${order.currencySymbol || order.currency || ''}${parseFloat(item.price).toFixed(2)}`,
    `${order.currencySymbol || order.currency || ''}${parseFloat(item.total).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`${order.currencySymbol || order.currency || ''}${parseFloat(order.subtotal || 0).toFixed(2)}`, 190, finalY, { align: 'right' });

  if (order.tax) {
    doc.text(`Tax:`, 140, finalY + 7);
    doc.text(`${order.currencySymbol || order.currency || ''}${parseFloat(order.tax).toFixed(2)}`, 190, finalY + 7, { align: 'right' });
  }

  if (order.discount) {
    doc.text(`Discount:`, 140, finalY + 14);
    doc.text(`-${order.currencySymbol || order.currency || ''}${parseFloat(order.discount).toFixed(2)}`, 190, finalY + 14, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount:`, 140, finalY + (order.tax || order.discount ? 21 : 7));
  doc.text(`${order.currencySymbol || order.currency || ''}${parseFloat(order.totalAmount || 0).toFixed(2)}`, 190, finalY + (order.tax || order.discount ? 21 : 7), { align: 'right' });

  // Notes
  if (order.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, finalY + 30);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(order.notes, pageWidth - 28);
    doc.text(splitNotes, 14, finalY + 37);
  }

  doc.save(`PO-${order.poNumber}.pdf`);
};
