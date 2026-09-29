import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportVendorBillToPDF = (bill: any, business: any = null) => {
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
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('VENDOR BILL', 14, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill Number: ${bill.billNumber}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Date: ${new Date(bill.billDate).toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });

  // Reset Text Color
  doc.setTextColor(...textColor);

  // Business and Vendor Blocks
  const blockY = 55;
  
  // From (Business)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('BILLED TO:', 14, blockY);
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.text(business?.name || 'Our Business', 14, blockY + 6);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  
  if (business?.address) {
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
  doc.text(bill.vendor?.name || '—', pageWidth / 2, blockY + 6);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  let vendorY = blockY + 12;
  if (bill.vendor?.email) { doc.text(bill.vendor.email, pageWidth / 2, vendorY); vendorY += 5; }
  if (bill.vendor?.phone) { doc.text(bill.vendor.phone, pageWidth / 2, vendorY); vendorY += 5; }

  // Other Details (Status, Expected Delivery)
  let detailsY = 95;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text(`Status:`, 14, detailsY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bill.status}`, 30, detailsY);

  if (bill.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Due Date:`, pageWidth / 2, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date(bill.dueDate).toLocaleDateString()}`, (pageWidth / 2) + 25, detailsY);
  }

  // Currency Handling (use code instead of symbol for jsPDF compatibility)
  const ccy = bill.currency || bill.currencyCode || 'INR';

  // Table
  const tableData = (bill.items || []).map((item: any, index: number) => [
    index + 1,
    item.product?.name || item.description || 'Item',
    item.quantity,
    `${ccy} ${parseFloat(item.price).toFixed(2)}`,
    `${ccy} ${parseFloat(item.total).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 105,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5, textColor: [51, 51, 51] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { cellWidth: 20, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    }
  });

  // Totals Box
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalsX = pageWidth - 90;
  
  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX - 10, finalY - 5, pageWidth - 14, finalY - 5);

  let currentY = finalY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  
  doc.text(`Subtotal:`, totalsX, currentY);
  doc.text(`${ccy} ${parseFloat(bill.subtotal || 0).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;

  if (bill.tax) {
    doc.text(`Tax:`, totalsX, currentY);
    doc.text(`${ccy} ${parseFloat(bill.tax).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 7;
  }

  if (bill.discount) {
    doc.text(`Discount:`, totalsX, currentY);
    doc.text(`-${ccy} ${parseFloat(bill.discount).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 7;
  }

  // Total Box Background
  doc.setFillColor(245, 247, 250);
  doc.rect(totalsX - 10, currentY - 2, 86, 12, 'F');

  currentY += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total:`, totalsX, currentY);
  doc.text(`${ccy} ${parseFloat(bill.totalAmount || 0).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });

  // Outstanding Box Background
  if (bill.outstandingAmount !== undefined) {
    currentY += 12;
    doc.setFillColor(254, 242, 242); // very light red
    doc.rect(totalsX - 10, currentY - 2, 86, 12, 'F');

    currentY += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // red for outstanding
    doc.text(`Outstanding:`, totalsX, currentY);
    doc.text(`${ccy} ${parseFloat(bill.outstandingAmount || 0).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
  }

  // Notes
  if (bill.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text('Notes / Terms:', 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const splitNotes = doc.splitTextToSize(bill.notes, pageWidth / 2);
    doc.text(splitNotes, 14, finalY + 6);
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Thank you for your business.', pageWidth / 2, footerY + 5, { align: 'center' });

  doc.save(`BILL-${bill.billNumber}.pdf`);
};
