import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportGRNToPDF = (grn: any, business: any = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Colors
  const primaryColor: [number, number, number] = [41, 128, 185];
  const textColor: [number, number, number] = [51, 51, 51];
  const mutedColor: [number, number, number] = [119, 119, 119];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GOODS RECEIVE NOTE', 14, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`GRN Number: ${grn.grnNumber}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Date: ${new Date(grn.receivedDate).toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });

  // Reset Text Color
  doc.setTextColor(...textColor);

  // Business and Vendor Blocks
  const blockY = 55;
  
  // From (Business)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('RECEIVING LOCATION:', 14, blockY);
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.text(business?.name || 'Our Business', 14, blockY + 6);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  
  if (grn.warehouse?.name) {
    doc.text(`Warehouse: ${grn.warehouse.name}`, 14, blockY + 12);
  } else if (business?.address) {
    let bizY = blockY + 12;
    const splitAddr = doc.splitTextToSize(business.address, (pageWidth / 2) - 20);
    doc.text(splitAddr, 14, bizY);
    bizY += (splitAddr.length * 5);
    
    const cityParts = [business.city, business.state, business.country].filter(Boolean);
    if (cityParts.length > 0) {
      doc.text(cityParts.join(', '), 14, bizY);
    }
  } else {
    doc.text('Corporate Office', 14, blockY + 12);
  }

  // To (Vendor)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('VENDOR DETAILS:', pageWidth / 2, blockY);
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.text(grn.vendor?.name || '—', pageWidth / 2, blockY + 6);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  let vendorY = blockY + 12;
  if (grn.vendor?.email) { doc.text(grn.vendor.email, pageWidth / 2, vendorY); vendorY += 5; }
  if (grn.vendor?.phone) { doc.text(grn.vendor.phone, pageWidth / 2, vendorY); vendorY += 5; }

  // Other Details (Status, PO Number)
  let detailsY = 95;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text(`Status:`, 14, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${grn.status}`, 30, detailsY);

  if (grn.purchaseOrder) {
    doc.setFont('helvetica', 'bold');
    doc.text(`PO Number:`, pageWidth / 2, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${grn.purchaseOrder.poNumber}`, (pageWidth / 2) + 25, detailsY);
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
    startY: 105,
    head: [['#', 'Description', 'Ordered', 'Received', 'Damaged']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5, textColor: [51, 51, 51] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
    }
  });

  // Summary Box
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalsX = pageWidth - 90;
  
  const totalOrdered = (grn.items || []).reduce((sum: number, i: any) => sum + (i.quantityOrdered || 0), 0);
  const totalReceived = (grn.items || []).reduce((sum: number, i: any) => sum + (i.quantityReceived || 0), 0);
  const totalDamaged = (grn.items || []).reduce((sum: number, i: any) => sum + (i.quantityDamaged || 0), 0);

  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX - 10, finalY - 5, pageWidth - 14, finalY - 5);

  let currentY = finalY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  
  doc.text(`Total Ordered:`, totalsX, currentY);
  doc.text(`${totalOrdered}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;

  doc.text(`Total Received:`, totalsX, currentY);
  doc.text(`${totalReceived}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;

  if (totalDamaged > 0) {
    doc.text(`Total Damaged:`, totalsX, currentY);
    doc.setTextColor(220, 38, 38); // Red color for damaged
    doc.text(`${totalDamaged}`, pageWidth - 14, currentY, { align: 'right' });
    doc.setTextColor(...textColor);
    currentY += 7;
  }

  // Total Box Background
  doc.setFillColor(245, 247, 250);
  doc.rect(totalsX - 10, currentY - 2, 86, 12, 'F');

  currentY += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Net Good Received:`, totalsX, currentY);
  doc.text(`${totalReceived - totalDamaged}`, pageWidth - 14, currentY, { align: 'right' });

  // Notes
  if (grn.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('Notes / Remarks:', 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const splitNotes = doc.splitTextToSize(grn.notes, pageWidth / 2);
    doc.text(splitNotes, 14, finalY + 6);
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Goods received in indicated condition.', pageWidth / 2, footerY + 5, { align: 'center' });

  doc.save(`GRN-${grn.grnNumber}.pdf`);
};
